/**
 * Qdrant vector store client wrapper
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from './logger';
import { RagChunk, VectorSearchParams, RagQueryResult } from './types';

const tracer = trace.getTracer('vector-store');

export interface VectorStoreConfig {
  url?: string;
  apiKey?: string;
  collectionName: string;
  vectorSize?: number;
}

export class VectorStore {
  private client: QdrantClient;
  private collectionName: string;
  private vectorSize: number;
  private initialized: boolean = false;

  constructor(config: VectorStoreConfig) {
    this.client = new QdrantClient({
      url: config.url || process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: config.apiKey || process.env.QDRANT_API_KEY,
    });
    this.collectionName = config.collectionName;
    this.vectorSize = config.vectorSize || 1536; // OpenAI text-embedding-3-large
  }

  /**
   * Initialize collection if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    return tracer.startActiveSpan('vectorStore.initialize', async (span) => {
      try {
        // Check if collection exists
        const collections = await this.client.getCollections();
        const exists = collections.collections.some(
          (c) => c.name === this.collectionName
        );

        if (!exists) {
          logger.info('Creating Qdrant collection', {
            collection: this.collectionName,
            vectorSize: this.vectorSize,
          });

          await this.client.createCollection(this.collectionName, {
            vectors: {
              size: this.vectorSize,
              distance: 'Cosine',
            },
            optimizers_config: {
              default_segment_number: 2,
            },
            replication_factor: 2,
          });

          // Create payload indexes for filtering
          await this.client.createPayloadIndex(this.collectionName, {
            field_name: 'metadata.agentId',
            field_schema: 'keyword',
          });

          await this.client.createPayloadIndex(this.collectionName, {
            field_name: 'metadata.category',
            field_schema: 'keyword',
          });

          await this.client.createPayloadIndex(this.collectionName, {
            field_name: 'metadata.timestamp',
            field_schema: 'datetime',
          });

          logger.info('Qdrant collection created successfully');
        } else {
          logger.info('Qdrant collection already exists', {
            collection: this.collectionName,
          });
        }

        this.initialized = true;
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to initialize Qdrant collection', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Store chunks in the vector database
   */
  async storeChunks(chunks: RagChunk[], embeddings: number[][]): Promise<void> {
    await this.initialize();

    return tracer.startActiveSpan('vectorStore.storeChunks', async (span) => {
      try {
        if (chunks.length !== embeddings.length) {
          throw new Error('Chunks and embeddings length mismatch');
        }

        const points = chunks.map((chunk, idx) => ({
          id: chunk.chunkId,
          vector: embeddings[idx],
          payload: {
            documentId: chunk.documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            metadata: {
              ...chunk.metadata,
              timestamp: chunk.metadata.timestamp.toISOString(),
            },
          },
        }));

        await this.client.upsert(this.collectionName, {
          wait: true,
          points,
        });

        logger.info('Stored chunks in vector database', {
          collection: this.collectionName,
          chunkCount: chunks.length,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('chunks.count', chunks.length);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to store chunks', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Search for relevant chunks
   */
  async search(params: {
    queryEmbedding: number[];
    limit?: number;
    scoreThreshold?: number;
    filter?: Record<string, unknown>;
  }): Promise<RagQueryResult> {
    await this.initialize();

    return tracer.startActiveSpan('vectorStore.search', async (span) => {
      try {
        const { queryEmbedding, limit = 5, scoreThreshold = 0.7, filter } = params;

        // Build Qdrant filter
        const qdrantFilter = filter ? this.buildFilter(filter) : undefined;

        const searchResult = await this.client.search(this.collectionName, {
          vector: queryEmbedding,
          limit,
          score_threshold: scoreThreshold,
          filter: qdrantFilter,
          with_payload: true,
        });

        const chunks = searchResult.map((result) => {
          const payload = result.payload as any;
          return {
            chunk: {
              chunkId: result.id as string,
              documentId: payload.documentId,
              content: payload.content,
              chunkIndex: payload.chunkIndex,
              totalChunks: payload.totalChunks,
              metadata: {
                ...payload.metadata,
                timestamp: new Date(payload.metadata.timestamp),
              },
            } as RagChunk,
            score: result.score,
          };
        });

        logger.debug('Vector search completed', {
          resultsFound: chunks.length,
          limit,
          scoreThreshold,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('results.count', chunks.length);

        return {
          chunks,
          totalResults: chunks.length,
        };
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Vector search failed', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Delete chunks by document ID
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.initialize();

    return tracer.startActiveSpan('vectorStore.deleteByDocumentId', async (span) => {
      try {
        await this.client.delete(this.collectionName, {
          wait: true,
          filter: {
            must: [
              {
                key: 'documentId',
                match: { value: documentId },
              },
            ],
          },
        });

        logger.info('Deleted chunks by document ID', { documentId });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to delete chunks', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get collection info
   */
  async getInfo(): Promise<any> {
    await this.initialize();

    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      logger.error('Failed to get collection info', { error });
      throw error;
    }
  }

  /**
   * Build Qdrant filter from simple object
   */
  private buildFilter(filter: Record<string, unknown>): any {
    const must: any[] = [];

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        must.push({
          key,
          match: { value },
        });
      }
    });

    return must.length > 0 ? { must } : undefined;
  }
}

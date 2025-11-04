/**
 * Complete RAG pipeline with chunking, embedding, indexing, and retrieval
 */

import OpenAI from 'openai';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from './logger';
import { VectorStore } from './vector-store';
import {
  RagDocument,
  RagChunk,
  VectorSearchParams,
  RagQueryResult,
  EmbeddingRequest,
  EmbeddingResponse,
} from './types';
import { v4 as uuidv4 } from 'uuid';

const tracer = trace.getTracer('rag-pipeline');

export interface RagPipelineConfig {
  vectorStore: VectorStore;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  openaiApiKey?: string;
}

export class RagPipeline {
  private vectorStore: VectorStore;
  private openai: OpenAI;
  private embeddingModel: string;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: RagPipelineConfig) {
    this.vectorStore = config.vectorStore;
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
    });
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-large';
    this.chunkSize = config.chunkSize || 1000; // tokens
    this.chunkOverlap = config.chunkOverlap || 200; // tokens
  }

  /**
   * Index a document (chunk, embed, store)
   */
  async indexDocument(document: RagDocument): Promise<void> {
    return tracer.startActiveSpan('ragPipeline.indexDocument', async (span) => {
      try {
        logger.info('Indexing document', {
          documentId: document.id,
          source: document.metadata.source,
          contentLength: document.content.length,
        });

        // Step 1: Chunk the document
        const chunks = await this.chunkDocument(document);
        logger.debug('Document chunked', {
          documentId: document.id,
          chunkCount: chunks.length,
        });

        // Step 2: Generate embeddings
        const embeddings = await this.generateEmbeddings(
          chunks.map((c) => c.content)
        );
        logger.debug('Embeddings generated', {
          documentId: document.id,
          embeddingCount: embeddings.embeddings.length,
        });

        // Step 3: Store in vector database
        await this.vectorStore.storeChunks(chunks, embeddings.embeddings);

        logger.info('Document indexed successfully', {
          documentId: document.id,
          chunkCount: chunks.length,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('chunks.count', chunks.length);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to index document', {
          error,
          documentId: document.id,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(documents: RagDocument[]): Promise<void> {
    return tracer.startActiveSpan('ragPipeline.indexDocuments', async (span) => {
      try {
        logger.info('Batch indexing documents', {
          documentCount: documents.length,
        });

        // Process in parallel with concurrency limit
        const BATCH_SIZE = 5;
        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
          const batch = documents.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map((doc) => this.indexDocument(doc)));
        }

        logger.info('Batch indexing completed', {
          documentCount: documents.length,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('documents.count', documents.length);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to batch index documents', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(params: VectorSearchParams): Promise<RagQueryResult> {
    return tracer.startActiveSpan('ragPipeline.retrieve', async (span) => {
      try {
        logger.debug('Retrieving relevant chunks', {
          query: params.query.substring(0, 100),
          limit: params.limit,
        });

        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(params.query);

        // Search vector database
        const results = await this.vectorStore.search({
          queryEmbedding,
          limit: params.limit || 5,
          scoreThreshold: params.scoreThreshold || 0.7,
          filter: params.filter,
        });

        logger.debug('Retrieved chunks', {
          resultCount: results.chunks.length,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('results.count', results.chunks.length);

        return results;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to retrieve chunks', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Chunk a document into overlapping segments
   */
  private async chunkDocument(document: RagDocument): Promise<RagChunk[]> {
    const chunks: RagChunk[] = [];
    const content = document.content;

    // Simple character-based chunking (can be improved with token counting)
    const charChunkSize = this.chunkSize * 4; // rough estimate: 1 token ≈ 4 chars
    const charOverlap = this.chunkOverlap * 4;

    let startIdx = 0;
    let chunkIndex = 0;

    while (startIdx < content.length) {
      const endIdx = Math.min(startIdx + charChunkSize, content.length);
      const chunkContent = content.substring(startIdx, endIdx);

      chunks.push({
        chunkId: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: chunkContent,
        chunkIndex,
        totalChunks: 0, // Will be updated after all chunks are created
        metadata: document.metadata,
      });

      chunkIndex++;
      startIdx = endIdx - charOverlap;

      // Prevent infinite loop
      if (startIdx >= content.length - charOverlap) {
        break;
      }
    }

    // Update total chunks count
    chunks.forEach((chunk) => {
      chunk.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Generate embeddings for multiple texts
   */
  private async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
    return tracer.startActiveSpan('ragPipeline.generateEmbeddings', async (span) => {
      try {
        const response = await this.openai.embeddings.create({
          model: this.embeddingModel,
          input: texts,
          encoding_format: 'float',
        });

        const embeddings = response.data.map((item) => item.embedding);

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('embeddings.count', embeddings.length);

        return {
          embeddings,
          model: this.embeddingModel,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            totalTokens: response.usage.total_tokens,
          },
        };
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to generate embeddings', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Generate embedding for a single text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.generateEmbeddings([text]);
    return result.embeddings[0];
  }

  /**
   * Delete a document from the index
   */
  async deleteDocument(documentId: string): Promise<void> {
    return tracer.startActiveSpan('ragPipeline.deleteDocument', async (span) => {
      try {
        await this.vectorStore.deleteByDocumentId(documentId);
        logger.info('Document deleted from index', { documentId });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to delete document', { error, documentId });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Build context from retrieved chunks for prompt
   */
  static buildContext(queryResult: RagQueryResult): string {
    if (queryResult.chunks.length === 0) {
      return 'No relevant information found in knowledge base.';
    }

    const contextParts = queryResult.chunks.map((result, idx) => {
      const { chunk, score } = result;
      return `[Document ${idx + 1}] (Relevance: ${(score * 100).toFixed(1)}%)\nSource: ${chunk.metadata.source}\n${chunk.content}`;
    });

    return contextParts.join('\n\n---\n\n');
  }
}

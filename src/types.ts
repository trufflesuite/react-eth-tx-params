import type * as Codec from "@truffle/codec";

// interfaces
export interface Source {
  language: string | undefined;
  lines: string[];
}

export interface SourceRange {
  source: {
    id: string;
  };
  from: {
    line: number;
    column: number;
  };
  to: {
    line: number;
    column: number;
  };
}

export interface ProcessCompilationOptions {
  compilation: Codec.Compilations.Compilation;
  astNodes: Codec.Ast.AstNodes;
}

export interface GatherDefinitionsOptions {
  compilations: Codec.Compilations.Compilation[];
  referenceDeclarations: {
    [compilationId: string]: Codec.Ast.AstNodes;
  };
}

export interface Definitions {
  compilationsById: {
    [compilationId: string]: {
      sourcesById: {
        [sourceId: string]: Source;
      };
      sourceRangesById: {
        [astId: string]: SourceRange;
      };
    };
  };
}

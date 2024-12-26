export type AttachesToolData<Actions = {}, AdditionalFileData = {}> = {
  file: {
    url: string;
    size: number;
    name: string;
    extension: string;
  } & AdditionalFileData;
  title: string;
} & (Actions extends Record<string, boolean> ? Actions : {});

export interface AttachesToolConfig {
  types: string;
  buttonContent: string;
  errorMessage: string;
  uploader?: {
    uploadByFile?: (file: Blob) => Promise<void>;
  };
}

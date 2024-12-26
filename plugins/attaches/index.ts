import "./index.css";
import type {
  API,
  ToolboxConfig,
  BlockToolConstructorOptions,
  BlockTool,
  BlockAPI,
} from "@editorjs/editorjs";

import { merge } from "lodash-es";
import Ui from "./ui";
import { blobToBase64, getExtensionFromFileName } from "@/utils/file";
import type { AttachesToolData, AttachesToolConfig } from "./types/types";
import { IconFile } from "@codexteam/icons";

type AttachesToolConstructorOptions = BlockToolConstructorOptions<
  AttachesToolData,
  AttachesToolConfig
>;

export default class AttachesTool implements BlockTool {
  private api: API;
  private block: BlockAPI;
  private config: AttachesToolConfig = {
    types: "*",
    buttonContent: "Select file to upload",
    errorMessage: "File upload failed",
  };
  private data: AttachesToolData = {
    file: { url: "", size: 0, name: "", extension: "" },
    title: "",
  };
  private readOnly: boolean;
  private ui: Ui;

  constructor({
    data,
    config,
    api,
    readOnly,
    block,
  }: AttachesToolConstructorOptions) {
    this.api = api;
    this.block = block;
    this.readOnly = readOnly;
    this.config = merge({}, this.config, config);
    this.data = merge({}, this.data, data);

    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: (file) => this.uploadFile(file),
      readOnly,
    });
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  public static get toolbox(): ToolboxConfig {
    return {
      icon: IconFile,
      title: "Attachment",
    };
  }

  public static get sanitize() {
    return {
      file: {
        url: false, // disallow HTML
        name: false,
        size: false,
        extension: false,
      },
      title: {}, // only tags from Inline Toolbar
    };
  }

  public render() {
    return this.ui.render(this.data);
  }

  public validate(savedData: AttachesToolData): boolean {
    return !!savedData.file.url.trim();
  }

  public save(): AttachesToolData {
    const titleNode = this.ui.nodes.fileTitle;
    this.data.title = titleNode.innerHTML;

    return this.data;
  }

  private async uploadFile(file: File): Promise<void> {
    try {
      const src = await blobToBase64(file);
      this.ui.showPreloader(src);
      if (this.config.uploader?.uploadByFile) {
        await this.config.uploader.uploadByFile(file);
      }
      this.data.file = {
        url: src,
        size: file.size,
        name: file.name,
        extension: getExtensionFromFileName(file.name),
      };
      this.data.title = file.name;
      this.ui.fillFileData(this.data);
    } catch (error: any) {
      console.log("error", error);
      this.uploadingFailed(error || error.message || "Unknown error");
    }
  }

  /**
   * Handle uploader errors
   */
  private uploadingFailed(errorText: string): void {
    console.log("Attaches Tool: uploading failed because of", errorText);

    this.api.notifier.show({
      message: this.api.i18n.t("Couldn't upload file. Please try another."),
      style: "error",
    });
    this.ui.hidePreloader();
  }
}

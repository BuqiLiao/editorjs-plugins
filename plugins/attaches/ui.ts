import ajax from "@codexteam/ajax";
import { IconChevronDown, IconFile } from "@codexteam/icons";
import { make, moveCaretToTheEnd } from "@/utils/dom";
import { getExtensionFromFileName, base64ToBlob } from "@/utils/file";
import type { API } from "@editorjs/editorjs";
import type { AttachesToolData, AttachesToolConfig } from "./types/types";

enum UiState {
  Empty = "empty",
  Uploading = "uploading",
  Filled = "filled",
}

/**
 * Base structure
 *  <wrapper>
 *    {if file}
 *      <file-icon-container>
 *        <file-icon-label />
 *      </file-icon-container>
 *      <file-info>
 *        <title />
 *        <size />
 *      </file-info>
 *      <download-button />
 *    {else}
 *      <upload-button />
 *    {/if}
 *  </wrapper>
 */

interface Nodes {
  wrapper: HTMLElement;
  fileIconContainer: HTMLElement;
  fileIconLabel: HTMLElement;
  fileInfo: HTMLElement;
  fileTitle: HTMLElement;
  fileSize: HTMLElement;
  downloadButton: HTMLAnchorElement;
  uploadButton: HTMLElement;
}

interface ConstructorParams {
  api: API;
  config: AttachesToolConfig;
  onSelectFile: (file: File) => void;
  readOnly: boolean;
}

export default class Ui {
  public nodes: Nodes;
  private api: API;
  private config: AttachesToolConfig;
  private onSelectFile: (file: File) => void;
  private readOnly: boolean;

  private get CSS() {
    return {
      baseClass: this.api.styles.block,
      apiButton: this.api.styles.button,
      loader: this.api.styles.loader,
      /**
       * Tool's classes
       */
      wrapper: "cdx-attaches",
      button: "cdx-attaches__button",
      title: "cdx-attaches__title",
      size: "cdx-attaches__size",
      downloadButton: "cdx-attaches__download-button",
      fileInfo: "cdx-attaches__file-info",
      fileIcon: "cdx-attaches__file-icon",
      fileIconLabel: "cdx-attaches__file-icon-label",
    };
  }

  private get extensionToColorMap(): Record<string, string> {
    return {
      doc: "#1483E9",
      docx: "#1483E9",
      odt: "#1483E9",
      pdf: "#DB2F2F",
      rtf: "#744FDC",
      tex: "#5a5a5b",
      txt: "#5a5a5b",
      pptx: "#E35200",
      ppt: "#E35200",
      mp3: "#eab456",
      mp4: "#f676a6",
      xls: "#11AE3D",
      html: "#2988f0",
      htm: "#2988f0",
      png: "#AA2284",
      jpg: "#D13359",
      jpeg: "#D13359",
      gif: "#f6af76",
      zip: "#4f566f",
      rar: "#4f566f",
      exe: "#e26f6f",
      svg: "#bf5252",
      key: "#00B2FF",
      sketch: "#FFC700",
      ai: "#FB601D",
      psd: "#388ae5",
      dmg: "#e26f6f",
      json: "#2988f0",
      csv: "#11AE3D",
    };
  }

  constructor({ api, config, onSelectFile, readOnly }: ConstructorParams) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      fileIconContainer: make("div", [this.CSS.fileIcon]),
      fileIconLabel: make("div", [this.CSS.fileIconLabel]),
      fileInfo: make("div", [this.CSS.fileInfo]),
      fileTitle: make("div", [this.CSS.title]),
      fileSize: make("div", [this.CSS.size]),
      downloadButton: make("a", [this.CSS.downloadButton]) as HTMLAnchorElement,
      uploadButton: this.createFileButton(),
    };

    this.nodes.fileIconContainer.appendChild(this.nodes.fileIconLabel);
    this.nodes.fileInfo.appendChild(this.nodes.fileTitle);
    this.nodes.fileInfo.appendChild(this.nodes.fileSize);
    this.nodes.wrapper.appendChild(this.nodes.fileIconContainer);
    this.nodes.wrapper.appendChild(this.nodes.fileInfo);
    this.nodes.wrapper.appendChild(this.nodes.downloadButton);
    this.nodes.wrapper.appendChild(this.nodes.uploadButton);
  }

  public render(toolData: AttachesToolData): HTMLElement {
    this.toggleStatus(!toolData.file.url ? UiState.Empty : UiState.Uploading);

    this.fillFileData(toolData);

    return this.nodes.wrapper;
  }

  public showPreloader(src: string): void {
    this.toggleStatus(UiState.Uploading);
  }

  public hidePreloader(): void {
    this.toggleStatus(UiState.Empty);
  }

  public fillFileData(toolData: AttachesToolData): void {
    if (!toolData.file.url) return;

    const { file, title } = toolData;

    this.fillFileIcon(file);
    this.fillFileTitle(title);
    this.fillFileSize(file);
    this.fillDownloadButton(file);

    moveCaretToTheEnd(this.nodes.fileTitle);
    this.toggleStatus(UiState.Filled);
  }

  private fillFileIcon(file: AttachesToolData["file"]): void {
    const extension = file.extension || getExtensionFromFileName(file.name);
    const extensionColor = this.extensionToColorMap[extension];

    this.nodes.fileIconContainer.style.backgroundColor =
      extensionColor || "#000";

    if (extension) {
      this.nodes.fileIconLabel.textContent = extension;
      this.nodes.fileIconLabel.title = extension;
    } else {
      this.nodes.fileIconLabel.innerHTML = IconFile;
    }
  }

  private fillFileTitle(title: AttachesToolData["title"]): void {
    this.nodes.fileTitle.contentEditable = String(this.readOnly === false);
    this.nodes.fileTitle.dataset.placeholder = this.api.i18n.t("File title");
    this.nodes.fileTitle.textContent = title || "";
    this.nodes.fileTitle.addEventListener("input", () => {
      if (
        this.nodes.fileTitle.innerHTML === "<br>" ||
        this.nodes.fileTitle.innerHTML.trim() === ""
      ) {
        this.nodes.fileTitle.innerHTML = "";
      }
    });
  }

  private fillFileSize(file: AttachesToolData["file"]): void {
    if (!file.size) return;

    let sizePrefix;
    let formattedSize;

    if (Math.log10(+file.size) >= 6) {
      sizePrefix = "MB";
      formattedSize = file.size / Math.pow(2, 20);
    } else {
      sizePrefix = "KB";
      formattedSize = file.size / Math.pow(2, 10);
    }

    this.nodes.fileSize.textContent = formattedSize.toFixed(1);
    this.nodes.fileSize.setAttribute("data-size", sizePrefix);
  }

  private fillDownloadButton(file: AttachesToolData["file"]): void {
    if (!file.url) return;

    this.nodes.downloadButton.innerHTML = IconChevronDown;
    this.nodes.downloadButton.target = "_blank";
    this.nodes.downloadButton.rel = "nofollow noindex noreferrer";

    if (file.url.startsWith("data:")) {
      const blob = base64ToBlob(file.url);
      const url = URL.createObjectURL(blob);
      this.nodes.downloadButton.href = url;
    } else {
      this.nodes.downloadButton.href = file.url;
    }
  }

  private createFileButton(): HTMLElement {
    const button = make("div", [this.CSS.apiButton, this.CSS.button]);
    button.innerHTML = `${IconFile} ${this.api.i18n.t(
      this.config.buttonContent
    )}`;
    button.addEventListener("click", () => {
      ajax
        .selectFiles({
          accept: this.config.types ?? "image/*",
        })
        .then((files) => {
          this.onSelectFile(files[0]);
        });
    });

    return button;
  }

  /**
   * Changes UI status
   */
  private toggleStatus(status: UiState): void {
    Object.values(UiState).forEach((statusValue) => {
      this.nodes.wrapper.classList.toggle(
        `${this.CSS.wrapper}--${statusValue}`,
        status === statusValue
      );
    });

    if (status === UiState.Uploading) {
      this.nodes.wrapper.classList.add(this.CSS.loader);
    } else {
      this.nodes.wrapper.classList.remove(this.CSS.loader);
    }
  }
}

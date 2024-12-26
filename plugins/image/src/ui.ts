import ajax from "@codexteam/ajax";
import { IconPicture } from "@codexteam/icons";
import { make } from "../../utils/dom";
import type { API } from "@editorjs/editorjs";
import type { ImageToolData, ImageConfig } from "./types/types";

/**
 * Enumeration representing the different states of the UI.
 */
enum UiState {
  /**
   * The UI is in an empty state, with no image loaded or being uploaded.
   */
  Empty = "empty",

  /**
   * The UI is in an uploading state, indicating an image is currently being uploaded.
   */
  Uploading = "uploading",

  /**
   * The UI is in a filled state, with an image successfully loaded.
   */
  Filled = "filled",
}

/**
 * Nodes interface representing various elements in the UI.
 */
interface Nodes {
  /**
   * Wrapper element in the UI.
   */
  wrapper: HTMLElement;

  /**
   * Container for the image element in the UI.
   */
  imageContainer: HTMLElement;

  /**
   * Button for selecting files.
   */
  fileButton: HTMLElement;

  /**
   * Represents the image element in the UI, if one is present; otherwise, it's undefined.
   */
  imageEl?: HTMLElement;

  /**
   * Preloader element for the image.
   */
  imagePreloader: HTMLElement;

  /**
   * Caption element for the image.
   */
  caption: HTMLElement;
}

/**
 * ConstructorParams interface representing parameters for the Ui class constructor.
 */
interface ConstructorParams {
  /**
   * Editor.js API.
   */
  api: API;
  /**
   * Configuration for the image.
   */
  config: ImageConfig;
  /**
   * Callback function for selecting a file.
   */
  onSelectFile: (file: File) => void;
  /**
   * Flag indicating if the UI is in read-only mode.
   */
  readOnly: boolean;
}

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * Nodes representing various elements in the UI.
   */
  public nodes: Nodes;

  /**
   * API instance for Editor.js.
   */
  private api: API;

  /**
   * Configuration for the image tool.
   */
  private config: ImageConfig;

  /**
   * Callback function for selecting a file.
   */
  private onSelectFile: (file: File) => void;

  /**
   * Flag indicating if the UI is in read-only mode.
   */
  private readOnly: boolean;

  /**
   * CSS classes
   */
  private get CSS(): Record<string, string> {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      // Tool's classes
      wrapper: "image-tool",
      imageContainer: "image-tool__image",
      imagePreloader: "image-tool__image-preloader",
      imageEl: "image-tool__image-picture",
      caption: "image-tool__caption",
    };
  }

  constructor({ api, config, onSelectFile, readOnly }: ConstructorParams) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make("div", [this.CSS.imageContainer]),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make("div", this.CSS.imagePreloader),
      caption: make("div", [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
    };

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.api.i18n.t(
      this.config.captionPlaceholder
    );
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    this.nodes.wrapper.appendChild(this.nodes.caption);
    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * Apply visual representation of activated tune
   */
  public applyTune(tuneName: string, status: boolean): void {
    this.nodes.wrapper.classList.toggle(
      `${this.CSS.wrapper}--${tuneName}`,
      status
    );
  }

  /**
   * Renders tool UI
   */
  public render(toolData: ImageToolData): HTMLElement {
    this.toggleStatus(!toolData.file.url ? UiState.Empty : UiState.Uploading);

    return this.nodes.wrapper;
  }

  /**
   * Shows uploading preloader
   */
  public showPreloader(src: string): void {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(UiState.Uploading);
  }

  /**
   * Hide uploading preloader
   */
  public hidePreloader(): void {
    this.nodes.imagePreloader.style.backgroundImage = "";
    this.toggleStatus(UiState.Empty);
  }

  /**
   * Shows an image
   */
  public fillImage(url: string): void {
    // Check for a source extension to compose element correctly: video tag for mp4, img — for others
    const isVideo = /\.mp4$/.test(url) || /^data:video\/mp4/.test(url);
    const tag = isVideo ? "VIDEO" : "IMG";

    const attributes: { [key: string]: string | boolean } = {
      src: url,
    };

    /**
     * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
     * - IMG: load
     * - VIDEO: loadeddata
     */
    let eventName = "load";

    // Update attributes and eventName if source is a mp4 video
    if (tag === "VIDEO") {
      // Add attributes for playing muted mp4 as a gif
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;

      // Change event to be listened
      eventName = "loadeddata";
    }

    // Compose tag with defined attributes
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

    console.log("this.nodes.imageEl", this.nodes.imageEl, tag, attributes);

    // Add load event listener
    this.nodes.imageEl.addEventListener(eventName, () => {
      this.toggleStatus(UiState.Filled);

      // Preloader does not exists on first rendering with presaved data
      if (this.nodes.imagePreloader !== undefined) {
        this.nodes.imagePreloader.style.backgroundImage = "";
      }
    });

    this.nodes.imageContainer.appendChild(this.nodes.imageEl);
  }

  /**
   * Shows caption input
   */
  public fillCaption(text: string): void {
    if (this.nodes.caption !== undefined) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * Creates upload-file button
   */
  private createFileButton(): HTMLElement {
    const button = make("div", [this.CSS.button]);
    button.innerHTML = `${IconPicture} ${this.api.i18n.t(
      this.config.buttonContent
    )}`;
    button.addEventListener("click", () => {
      ajax
        .selectFiles({
          accept: this.config.types,
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
  }
}

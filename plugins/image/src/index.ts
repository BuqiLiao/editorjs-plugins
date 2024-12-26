import "./index.css";
import { merge } from "lodash-es";
import { blobToBase64 } from "../../utils/file";
import {
  IconAddBorder,
  IconStretch,
  IconAddBackground,
  IconPicture,
  IconText,
} from "@codexteam/icons";
import Ui from "./ui";

import type { TunesMenuConfig } from "@editorjs/editorjs/types/tools";
import type {
  API,
  ToolboxConfig,
  PasteConfig,
  BlockToolConstructorOptions,
  BlockTool,
  BlockAPI,
  PasteEvent,
  PatternPasteEventDetail,
  FilePasteEventDetail,
} from "@editorjs/editorjs";
import type {
  ActionConfig,
  ImageToolData,
  ImageConfig,
  HTMLPasteEventDetailExtended,
  FeaturesConfig,
} from "./types/types";

type ImageToolConstructorOptions = BlockToolConstructorOptions<
  ImageToolData,
  ImageConfig
>;

/**
 * Implementation of ImageTool class
 */
export default class ImageTool implements BlockTool {
  /**
   * Editor.js API instance
   */
  private api: API;

  /**
   * Current Block API instance
   */
  private block: BlockAPI;

  /**
   * Configuration for the ImageTool
   */
  private config: ImageConfig = {
    types: "image/*",
    captionPlaceholder: "Caption",
    buttonContent: "Select an Image",
    actions: [],
    features: {
      withBorder: true,
      withBackground: true,
      withCaption: true,
      stretched: true,
    },
  };

  private readOnly: boolean;

  /**
   * UI module instance
   */
  private ui: Ui;

  /**
   * Stores current block data internally
   */
  private data: ImageToolData = {
    file: { url: "" },
    caption: "",
    withCaption: true,
    withBorder: false,
    withBackground: false,
    stretched: false,
  };

  /**
   * Map of available tunes
   */
  private tunesMap: Map<string, ActionConfig> = new Map();

  constructor({
    data,
    config,
    api,
    readOnly,
    block,
  }: ImageToolConstructorOptions) {
    this.api = api;
    this.block = block;
    this.readOnly = readOnly;
    this.config = merge({}, this.config, config);
    this.data = merge({}, this.data, data);

    // Module for working with UI
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: (file) => this.uploadFile(file),
      readOnly,
    });

    // Init available tunes
    const combinedTunes = new Map<string, ActionConfig>();
    ImageTool.defaultTunes.forEach((defaultTune) => {
      combinedTunes.set(defaultTune.name, defaultTune);
    });
    this.config.actions.forEach((customTune) => {
      combinedTunes.set(customTune.name, customTune);
    });
    for (const [tuneName, _] of combinedTunes) {
      if (this.config.features[tuneName as keyof FeaturesConfig] === false) {
        combinedTunes.delete(tuneName);
      }
    }
    this.tunesMap = new Map(combinedTunes);
  }

  /**
   * Notify core that read-only mode is supported
   */
  public static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   */
  public static get toolbox(): ToolboxConfig {
    return {
      icon: IconPicture,
      title: "Image",
    };
  }

  /**
   * Available image tools
   */
  public static get defaultTunes(): Array<ActionConfig> {
    return [
      {
        name: "withBorder",
        icon: IconAddBorder,
        title: "With border",
        toggle: true,
        action: function (ui, { data }) {
          ui.applyTune("withBorder", data.withBorder);
        },
      },
      {
        name: "stretched",
        icon: IconStretch,
        title: "Stretch image",
        toggle: true,
        action: function (ui, { data, block }) {
          ui.applyTune("stretched", data.stretched);
          Promise.resolve()
            .then(() => {
              block.stretched = data.stretched;
            })
            .catch((err) => {
              console.error(err);
            });
        },
      },
      {
        name: "withBackground",
        icon: IconAddBackground,
        title: "With background",
        toggle: true,
        action: function (ui, { data }) {
          ui.applyTune("withBackground", data.withBackground);
        },
      },
      {
        name: "withCaption",
        icon: IconText,
        title: "With caption",
        toggle: true,
        action: function (ui, { data }) {
          ui.applyTune("withCaption", data.withCaption);
          if (data.withCaption === false) {
            data.caption = "";
            ui.fillCaption("");
          }
        },
      },
    ];
  }

  public static get sanitize() {
    return {
      file: {
        url: false, // disallow HTML
      },
      caption: {}, // only tags from Inline Toolbar
    };
  }

  /**
   * Renders Block content
   */
  public render(): HTMLDivElement {
    console.log("render ImageTool", this.data);
    if (this.data.file?.url) {
      this.ui.fillImage(this.data.file.url);
    }
    if (this.data.caption) {
      this.ui.fillCaption(this.data.caption);
    }
    if (this.tunesMap.get("withCaption")) {
      this.ui.applyTune("withCaption", true);
    }

    return this.ui.render(this.data) as HTMLDivElement;
  }

  /**
   * Validate data: check if Image exists
   */
  public validate(savedData: ImageToolData): boolean {
    return !!savedData.file.url.trim();
  }

  /**
   * Return Block data
   */
  public save(): ImageToolData {
    if (this.tunesMap.get("withCaption")) {
      const captionNode = this.ui.nodes.caption;
      this.data.caption = captionNode.innerHTML;
    }

    return this.data;
  }

  /**
   * Returns configuration for block tunes: add background, add border, stretch image
   */
  public renderSettings(): TunesMenuConfig {
    return Array.from(this.tunesMap.values()).map((tune) => {
      const { icon, title, name, toggle } = tune;
      return {
        icon,
        label: this.api.i18n.t(title),
        name,
        toggle,
        isActive: this.data[name as keyof ImageToolData] as boolean,
        onActivate: () => {
          if (name in this.data) {
            const key = name as keyof ImageToolData;
            (this.data[key] as boolean) = !(this.data[key] as boolean);
          }
          if (typeof tune.action === "function") {
            tune.action(this.ui, {
              data: this.data,
              api: this.api,
              block: this.block,
              config: this.config,
              readOnly: this.readOnly,
            });
          }
        },
      };
    });
  }

  /**
   * Specify paste substitutes
   */
  public static get pasteConfig(): PasteConfig {
    return {
      // Paste HTML into Editor
      tags: [
        {
          img: { src: true },
        },
      ],
      // Paste URL of image into the Editor
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|svg|webp)(\?[a-z0-9=]*)?$/i,
      },
      // Drag n drop file from into the Editor
      files: {
        mimeTypes: ["image/*"],
      },
    };
  }

  /**
   * Specify paste handlers
   */
  public async onPaste(event: PasteEvent): Promise<void> {
    switch (event.type) {
      case "tag": {
        const image = (event.detail as HTMLPasteEventDetailExtended).data;
        /** Images from PDF */
        if (/^blob:/.test(image.src)) {
          const response = await fetch(image.src);
          const file = await response.blob();
          this.uploadFile(file as File);
          break;
        }

        this.uploadUrl(image.src);
        break;
      }
      case "pattern": {
        const url = (event.detail as PatternPasteEventDetail).data;
        this.uploadUrl(url);
        break;
      }
      case "file": {
        const file = (event.detail as FilePasteEventDetail).file;
        this.uploadFile(file);
        break;
      }
    }
  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿'̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Show preloader and upload image file
   */
  private async uploadFile(file: File): Promise<void> {
    try {
      const src = await blobToBase64(file);
      this.ui.showPreloader(src);
      if (this.config.uploader?.uploadByFile) {
        await this.config.uploader.uploadByFile(file);
      }
      this.data.file = { url: src };
      this.ui.fillImage(src);
    } catch (error: any) {
      this.uploadingFailed(error.message || "Unknown error");
    }
  }

  /**
   * Show preloader and upload image by target url
   */
  private async uploadUrl(url: string): Promise<void> {
    try {
      this.ui.showPreloader(url);
      if (this.config.uploader?.uploadByUrl) {
        await this.config.uploader.uploadByUrl(url);
      }
      this.data.file = { url };
      this.ui.fillImage(url);
    } catch (error: any) {
      this.uploadingFailed(error.message || "Unknown error");
    }
  }

  /**
   * Handle uploader errors
   */
  private uploadingFailed(errorText: string): void {
    console.log("Image Tool: uploading failed because of", errorText);

    this.api.notifier.show({
      message: this.api.i18n.t("Couldn't upload image. Please try another."),
      style: "error",
    });
    this.ui.hidePreloader();
  }
}

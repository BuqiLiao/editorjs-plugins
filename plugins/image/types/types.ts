import type {
  HTMLPasteEventDetail,
  BlockToolConstructorOptions,
} from "@editorjs/editorjs";
import Ui from "../ui";

/**
 * User configuration of Image block tunes. Allows to add custom tunes through the config
 */
export interface ActionConfig {
  /**
   * The name of the tune.
   */
  name: string;

  /**
   * The icon for the tune. Should be an SVG string.
   */
  icon: string;

  /**
   * The title of the tune. This will be displayed in the UI.
   */
  title: string;

  /**
   * An optional flag indicating whether the tune is a toggle (true) or not (false).
   */
  toggle?: boolean;

  /**
   * An optional action function to be executed when the tune is activated.
   */
  action: (ui: Ui, options: BlockToolConstructorOptions) => void;
}

/**
 * ImageToolData type representing the input and output data format for the image tool, including optional custome actions.
 */
export type ImageToolData<Actions = {}, AdditionalFileData = {}> = {
  /**
   * Object containing the URL of the image file.
   * Also can contain any additional data.
   */
  file: {
    /**
     * The URL of the image.
     */
    url: string;
  } & AdditionalFileData;
  /**
   * Caption for the image.
   */
  caption: string;
} & FeaturesConfig &
  (Actions extends Record<string, boolean> ? Actions : {});

/**
 * @description Allows to enable or disable features.
 */
export type FeaturesConfig = {
  /**
   * Flag to enable/disable tune - background.
   */
  withBackground?: boolean;
  /**
   * Flag to enable/disable tune - border.
   */
  withBorder?: boolean;
  /**
   * Flag to enable/disable caption.
   * Can be set to 'optional' to allow users to toggle via block tunes.
   */
  withCaption?: boolean;
  /**
   * Flag to enable/disable tune - stretched
   */
  stretched?: boolean;
};

/**
 *
 * @description Config supported by Tool
 */
export interface ImageConfig {
  /**
   * Allowed mime-types for the uploaded image.
   */
  types: string;

  /**
   * Placeholder text for the caption field.
   */
  captionPlaceholder: string;

  /**
   * Custom content for the select file button.
   */
  buttonContent: string;

  /**
   * Optional custom uploader.
   */
  uploader?: {
    /**
     * Method to upload an image by file.
     */
    uploadByFile?: (file: File) => Promise<void>;

    /**
     * Method to upload an image by URL.
     */
    uploadByUrl?: (url: string) => Promise<void>;
  };

  /**
   * Additional actions for the tool.
   */
  actions: ActionConfig[];

  /**
   * Tunes to be enabled.
   */
  features: FeaturesConfig;
}

/**
 * Interface representing the details of a paste event for HTML elements.
 * Extends the `HTMLPasteEventDetail` interface to include additional data properties.
 */
export interface HTMLPasteEventDetailExtended extends HTMLPasteEventDetail {
  /**
   * The data property containing the source of the image and HTML element details.
   */
  data: {
    /**
     * The source URL of the pasted image.
     */
    src: string;
  } & HTMLElement;
}

/**
 * Parameter type of Image setter function in ImageTool
 */
export type ImageSetterParam = {
  /**
   * url path of the image
   */
  url: string;
};

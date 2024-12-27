import "./index.css";
import "mathlive/fonts.css";
import { merge } from "lodash-es";
import { make } from "@/utils/dom";
import { MathfieldElement } from "mathlive";

import type {
  API,
  BlockTool,
  ToolboxConfig,
  BlockAPI,
  BlockToolConstructorOptions,
} from "@editorjs/editorjs";

interface MathToolData {
  formula: string;
}

interface MathToolConfig {
  placeholder?: string;
}

type MathToolConstructorOptions = BlockToolConstructorOptions<
  MathToolData,
  MathToolConfig
>;

/**
 * Base structure
 *  <wrapper>
 *   <math-field/>
 *  </wrapper>
 */

interface Nodes {
  wrapper: HTMLElement;
  mathField: MathfieldElement;
}

MathfieldElement.soundsDirectory = null;

export default class MathTool implements BlockTool {
  private api: API;
  private nodes: Nodes;
  private block: BlockAPI;
  private config: MathToolConfig = {
    placeholder: "Enter formula",
  };
  private data: MathToolData = {
    formula: "",
  };

  private get CSS() {
    return {
      baseClass: this.api.styles.block,
      wrapper: "math-tool",
      mathField: "math-tool__math-field",
    };
  }

  constructor({
    data,
    api,
    config,
    readOnly,
    block,
  }: MathToolConstructorOptions) {
    this.api = api;
    this.block = block;
    this.config = merge({}, this.config, config);
    this.data = merge({}, this.data, data);
    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      mathField: this.createMathField(),
    };
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  public static get toolbox(): ToolboxConfig {
    return {
      title: "Formula",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.482 3.827c-1.113-.824-2.696-.091-2.788 1.29L9.535 7.5h2.715a.75.75 0 0 1 0 1.5H9.435l-.6 9.006c-.18 2.685-3.358 4.002-5.383 2.23l-.196-.172a.75.75 0 0 1 .988-1.129l.195.171c1.091.955 2.803.246 2.899-1.2L7.932 9H5.75a.75.75 0 0 1 0-1.5h2.282l.165-2.483c.171-2.565 3.112-3.926 5.178-2.395l.371.275a.75.75 0 1 1-.892 1.205zm1.23 8.936a.75.75 0 0 0-1.152-.22l-.322.276a.75.75 0 1 1-.976-1.139l.322-.276a2.25 2.25 0 0 1 3.456.66l.977 1.858l2.703-2.703a.75.75 0 1 1 1.06 1.061l-3.031 3.032l1.539 2.924a.75.75 0 0 0 1.152.22l.322-.276a.75.75 0 0 1 .976 1.14l-.322.275a2.25 2.25 0 0 1-3.456-.66l-1.322-2.513l-3.358 3.358a.75.75 0 1 1-1.06-1.06l3.687-3.687z" />
            </svg>`,
    };
  }

  public static get sanitize() {
    return {
      formula: false,
    };
  }

  public render(): HTMLElement {
    this.nodes.wrapper.appendChild(this.nodes.mathField);
    this.api.blocks.insert("paragraph");
    return this.nodes.wrapper;
  }

  public save(block: HTMLElement): MathToolData {
    this.data.formula = this.nodes.mathField.getValue();
    return {
      formula: this.data.formula,
    };
  }

  public validate(savedData: MathToolData): boolean {
    return !!savedData.formula.trim();
  }

  public loadData(data: MathToolData): void {
    console.log("loadData", data);
  }

  public static get conversionConfig() {
    return {
      export: "formula",
      import: "formula",
    };
  }

  public static get enableLineBreaks() {
    return true;
  }

  private createMathField(): MathfieldElement {
    const mathField = new MathfieldElement();
    mathField.classList.add(this.CSS.mathField);
    mathField.setAttribute("placeholder", `\\text{${this.config.placeholder}}`);
    mathField.setValue(this.data.formula);
    mathField.addEventListener("keydown", (event) => {
      event.stopPropagation();
    });
    mathField.addEventListener("input", () => {
      this.block.dispatchChange();
    });

    return mathField;
  }
}

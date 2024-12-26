/**
 * Module declaration for '@codexteam/ajax'.
 */
declare module "@codexteam/ajax" {
  /**
   * Parameter type of selectFiles function in AjaxOptions interface
   */
  export type AjaxFileOptionsParam = {
    /**
     * the accepted file types.
     */
    accept: string;
  };

  /**
   * Prompts the user to select files and returns a promise that resolves with the selected files.
   * @param options - Options for file selection.
   * @param options.accept - The accepted file types.
   * @returns A promise that resolves with the selected files.
   */
  export function selectFiles(options: AjaxFileOptionsParam): Promise<File[]>;
}

# Editor.js Plugins

This repository contains plugins for [Editor.js](https://editorjs.io/), a modular, extendable content editing library. Currently, it includes the `ImageTool`, `AttachesTool`, and `MathTool` plugins, which are designed to enhance the user experience when working with images, attachments, and mathematical formulas.

---

## Features

- **ImageTool**: Upload and manage images with features such as captions, border styles, and background options.
- **AttachesTool**: Manage file attachments with features like custom uploading, download buttons, and file size display.
- **MathTool**: Create and edit mathematical formulas with a user-friendly interface.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>=16.0.0)
- [Editor.js](https://editorjs.io/) (latest version)

---

### Installation

Install the package via npm:

```bash
npm install editorjs-plugins
```

---

## Usage

### ImageTool

To use the `ImageTool`, you need to import it and add it to the Editor.js tools configuration. Below is an example of how to set it up:

```javascript
import EditorJS from "@editorjs/editorjs";
import { ImageTool } from "editorjs-plugins";

const editor = new EditorJS({
  holder: "editorjs",
  tools: {
    image: {
      class: ImageTool,
      config: {
        types: "image/*",
        captionPlaceholder: "Enter a caption",
        buttonContent: "Select an Image",
        uploader: {
          uploadByFile: (file) => {
            // Implement your file upload logic here
            return Promise.resolve({
              success: 1,
              file: {
                url: "https://example.com/image.jpg",
              },
            });
          },
          uploadByUrl: (url) => {
            // Implement your URL upload logic here
            return Promise.resolve({
              success: 1,
              file: {
                url: url,
              },
            });
          },
        },
      },
    },
  },
});
```

### AttachesTool

Similarly, to use the `AttachesTool`, import it and configure it in the Editor.js tools:

```javascript
import EditorJS from "@editorjs/editorjs";
import { AttachesTool } from "editorjs-plugins";

const editor = new EditorJS({
  holder: "editorjs",
  tools: {
    attaches: {
      class: AttachesTool,
      config: {
        types: "*",
        buttonContent: "Select file to upload",
        uploader: {
          uploadByFile: (file) => {
            // Implement your file upload logic here
            return Promise.resolve({
              success: 1,
              file: {
                url: "https://example.com/file.pdf",
                name: file.name,
                size: file.size,
              },
            });
          },
        },
      },
    },
  },
});
```

### MathTool

To use the `MathTool`, import it and configure it in the Editor.js tools:

```javascript
import EditorJS from "@editorjs/editorjs";
import MathTool from "editorjs-plugins/plugins/math";

const editor = new EditorJS({
  holder: "editorjs",
  tools: {
    math: {
      class: MathTool,
      config: {
        placeholder: "Enter formula",
      },
    },
  },
});
```

---

## Development

To build the project, run:

```bash
npm run build
```

To watch for changes and rebuild automatically, run:

```bash
npm run watch
```

---

## License

This project is licensed under the MIT License.

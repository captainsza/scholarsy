"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2
} from "lucide-react";

interface NoticeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NoticeEditor({ value, onChange }: NoticeEditorProps) {
  const [editorValue, setEditorValue] = useState(value);
  
  // Handle editor changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorValue(e.target.value);
    onChange(e.target.value);
  };

  // Apply formatting to selected text
  const applyFormatting = (format: string) => {
    const textarea = document.getElementById("noticeEditor") as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorValue.substring(start, end);
    
    let formattedText = "";
    let newCursorPosition = end;
    
    switch (format) {
      case "bold":
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case "italic":
        formattedText = `<em>${selectedText}</em>`;
        break;
      case "underline":
        formattedText = `<u>${selectedText}</u>`;
        break;
      case "ul":
        formattedText = `<ul>\n  <li>${selectedText}</li>\n</ul>`;
        break;
      case "ol":
        formattedText = `<ol>\n  <li>${selectedText}</li>\n</ol>`;
        break;
      case "h1":
        formattedText = `<h1>${selectedText}</h1>`;
        break;
      case "h2":
        formattedText = `<h2>${selectedText}</h2>`;
        break;
      case "link":
        const url = prompt("Enter the URL:");
        if (url) {
          formattedText = `<a href="${url}" target="_blank">${selectedText || url}</a>`;
        } else {
          return;
        }
        break;
      case "left":
        formattedText = `<div style="text-align: left;">${selectedText}</div>`;
        break;
      case "center":
        formattedText = `<div style="text-align: center;">${selectedText}</div>`;
        break;
      case "right":
        formattedText = `<div style="text-align: right;">${selectedText}</div>`;
        break;
    }
    
    const newValue = 
      editorValue.substring(0, start) +
      formattedText +
      editorValue.substring(end);
    
    setEditorValue(newValue);
    onChange(newValue);
    
    // Set cursor position after the formatted text
    newCursorPosition = start + formattedText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("h1")}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("h2")}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("ul")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("ol")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("link")}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("left")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("center")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => applyFormatting("right")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <textarea
        id="noticeEditor"
        value={editorValue}
        onChange={handleChange}
        className="w-full p-3 min-h-[200px] focus:outline-none"
        placeholder="Write your notice content here..."
      />
      
      {/* Preview */}
      <div className="border-t p-3">
        <div className="text-sm font-medium text-gray-500 mb-2">Preview:</div>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: editorValue }}
        />
      </div>
    </div>
  );
}

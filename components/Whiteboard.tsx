"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Trash2, RotateCcw, Maximize2, Minimize2, X, Eraser, Type, Save, Move } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  strokeWidth: number;
  id: string;
}

interface TextField {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
}

type Tool = 'draw' | 'erase' | 'text';

interface WhiteboardProps {
  width?: number;
  height?: number;
  storageKey?: string;
  className?: string;
  blogMode?: boolean;
  previewHeight?: number;
  blogSlug?: string;
  src?: string; // If provided, load from this file instead of localStorage
}

export function Whiteboard({ 
  width = 800, 
  height = 600, 
  storageKey = "whiteboard-drawing",
  className = "",
  blogMode = false,
  previewHeight = 300,
  blogSlug,
  src
}: WhiteboardProps) {
  const [paths, setPaths] = useState<Path[]>([]);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tool, setTool] = useState<Tool>('draw');
  const [moveMode, setMoveMode] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [savedFileName, setSavedFileName] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { theme, systemTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const fullSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: width * 2, height: height * 2 });

  // Determine current theme
  const getIsDark = (): boolean => {
    if (!mounted) return false;
    const currentTheme = theme === 'system' ? systemTheme : theme;
    if (currentTheme) return currentTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const isDark = getIsDark();
  const [strokeColor, setStrokeColor] = useState(isDark ? "#ffffff" : "#000000");

  // Update stroke color when theme changes
  useEffect(() => {
    setMounted(true);
    if (mounted) {
      setStrokeColor(isDark ? "#ffffff" : "#000000");
    }
  }, [theme, systemTheme, mounted, isDark]);


  // Load from localStorage on mount (only if not loading from file)
  useEffect(() => {
    if (src) return; // Don't load from localStorage if loading from file
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.paths && Array.isArray(parsed.paths)) {
          setPaths(parsed.paths);
        }
        if (parsed.textFields && Array.isArray(parsed.textFields)) {
          setTextFields(parsed.textFields.map((tf: any) => ({ ...tf, isEditing: false })));
        }
        if (parsed.savedFileName) {
          setSavedFileName(parsed.savedFileName);
        }
      } else {
        // Try old format (just paths array)
        const oldSaved = localStorage.getItem(storageKey);
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          if (Array.isArray(parsed)) {
            setPaths(parsed);
          }
        }
      }
    } catch (error) {
      console.error("Error loading whiteboard from localStorage:", error);
    }
  }, [storageKey, src]);

  // Save to localStorage whenever paths or textFields change (only if not loading from file)
  useEffect(() => {
    if (src) return; // Don't save to localStorage if loading from file
    
    if (paths.length > 0 || textFields.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ 
          paths, 
          textFields: textFields.map(tf => ({ ...tf, isEditing: false })),
          savedFileName 
        }));
      } catch (error) {
        console.error("Error saving whiteboard to localStorage:", error);
      }
    }
  }, [paths, textFields, storageKey, savedFileName, src]);

  // Focus text input when editing
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }, 10);
    }
  }, [editingTextId]);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  // Get the active SVG element based on mode
  const getActiveSvg = (): SVGSVGElement | null => {
    if (blogMode && isExpanded && fullSvgRef.current) {
      return fullSvgRef.current;
    }
    return svgRef.current;
  };

  // Erase paths that intersect with the eraser point
  const eraseAtPoint = useCallback((point: Point) => {
    const eraserRadius = strokeWidth * 2;
    setPaths((prev) => {
      return prev.filter((path) => {
        // Check if any point in the path is within eraser radius
        return !path.points.some((p) => {
          const dx = p.x - point.x;
          const dy = p.y - point.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < eraserRadius;
        });
      });
    });
  }, [strokeWidth]);

  // Get actual container dimensions or use defaults
  const getDrawingDimensions = () => {
    if (blogMode && isExpanded) {
      // In expanded mode, use viewport dimensions
      if (typeof window !== 'undefined') {
        return { 
          width: window.innerWidth * 2, 
          height: window.innerHeight * 2 
        };
      }
    }
    
    // Use container size state if available, otherwise use props
    if (containerSize.width > 0 && containerSize.height > 0) {
      return containerSize;
    }
    
    return { width: width * 2, height: height * 2 };
  };

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (blogMode && isExpanded) {
        // In expanded mode, use viewport
        if (typeof window !== 'undefined') {
          setContainerSize({ 
            width: window.innerWidth * 2, 
            height: window.innerHeight * 2 
          });
        }
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width * 2, height: rect.height * 2 });
        }
      }
    };
    
    // Initial update
    const timeoutId = setTimeout(updateSize, 0);
    
    // Update on resize
    window.addEventListener('resize', updateSize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, [blogMode, isExpanded, width, height]);

  const getPointFromEvent = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>, targetSvg: SVGSVGElement): Point | null => {
    if (!targetSvg) return null;
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Use SVG's coordinate transformation to handle viewBox correctly
    try {
      const pt = targetSvg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      
      // Transform screen coordinates to SVG coordinates using viewBox
      const ctm = targetSvg.getScreenCTM();
      if (ctm) {
        const svgPoint = pt.matrixTransform(ctm.inverse());
        const dims = getDrawingDimensions();
        return {
          x: Math.max(0, Math.min(svgPoint.x, dims.width)),
          y: Math.max(0, Math.min(svgPoint.y, dims.height)),
        };
      }
    } catch (error) {
      // Fallback to simple calculation if transformation fails
      console.warn('SVG coordinate transformation failed, using fallback', error);
    }
    
    // Fallback: simple coordinate calculation using viewBox
    const rect = targetSvg.getBoundingClientRect();
    const dims = getDrawingDimensions();
    const viewBox = targetSvg.viewBox.baseVal;
    
    if (viewBox.width && viewBox.height) {
      // Use viewBox dimensions
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const offsetX = viewBox.x || 0;
      const offsetY = viewBox.y || 0;
      
      return {
        x: Math.max(0, Math.min((clientX - rect.left) * scaleX + offsetX, dims.width)),
        y: Math.max(0, Math.min((clientY - rect.top) * scaleY + offsetY, dims.height)),
      };
    }
    
    // Last resort: simple scaling
    const scaleX = dims.width / rect.width;
    const scaleY = dims.height / rect.height;
    
    return {
      x: Math.max(0, Math.min((clientX - rect.left) * scaleX, dims.width)),
      y: Math.max(0, Math.min((clientY - rect.top) * scaleY, dims.height)),
    };
  };

  const finishTextEditing = useCallback(() => {
    if (editingTextId) {
      const trimmedText = textInput.trim();
      // Remove text field if empty
      if (!trimmedText) {
        deleteTextField(editingTextId);
      } else {
        setTextFields((prev) =>
          prev.map((tf) =>
            tf.id === editingTextId
              ? { ...tf, text: trimmedText, isEditing: false }
              : tf
          )
        );
      }
      // Keep selected but stop editing
      setEditingTextId(null);
      setTextInput('');
    }
  }, [editingTextId, textInput]);

  const startDrawing = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const targetSvg = getActiveSvg();
    if (!targetSvg) return;
    
    const point = getPointFromEvent(e, targetSvg);
    if (!point) return;

    if (tool === 'text') {
      // Check if clicking on an existing text field
      const clickedTextField = textFields.find(tf => {
        const textWidth = Math.max(50, (tf.text.length || 1) * tf.fontSize * 0.6);
        const textHeight = tf.fontSize;
        const dx = point.x - tf.x;
        const dy = point.y - tf.y;
        // Check if click is within text bounds
        return dx >= -5 && dx <= textWidth + 5 && Math.abs(dy) <= textHeight / 2 + 5;
      });

      if (clickedTextField) {
        if (moveMode) {
          // Start dragging in move mode
          setSelectedTextId(clickedTextField.id);
          setDraggingTextId(clickedTextField.id);
          setDragOffset({ x: point.x - clickedTextField.x, y: point.y - clickedTextField.y });
          return;
        } else {
          // Start editing when clicking on text field
          setSelectedTextId(clickedTextField.id);
          setEditingTextId(clickedTextField.id);
          setTextInput(clickedTextField.text);
          return;
        }
      }

      // Finish editing any existing text first
      if (editingTextId) {
        finishTextEditing();
      }
      
      // Don't create new text field in move mode
      if (moveMode) {
        return;
      }
      
      // Add text field at click position
      const newTextField: TextField = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        x: point.x,
        y: point.y,
        text: '',
        fontSize: 24,
        color: strokeColor,
        isEditing: true,
      };
      setTextFields((prev) => [...prev, newTextField]);
      setEditingTextId(newTextField.id);
      setSelectedTextId(newTextField.id);
      setTextInput('');
      return;
    }

    if (tool === 'erase') {
      setIsErasing(true);
      eraseAtPoint(point);
      return;
    }

    // Draw mode
    if (tool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([point]);
    }
  }, [blogMode, isExpanded, tool, strokeColor, eraseAtPoint, editingTextId, finishTextEditing, moveMode, textFields]);

  const draw = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    const targetSvg = getActiveSvg();
    if (!targetSvg) return;
    
    const point = getPointFromEvent(e, targetSvg);
    if (!point) return;

    // Handle text field dragging
    if (draggingTextId && dragOffset) {
      setTextFields((prev) =>
        prev.map((tf) =>
          tf.id === draggingTextId
            ? { ...tf, x: point.x - dragOffset.x, y: point.y - dragOffset.y }
            : tf
        )
      );
      return;
    }

    if (tool === 'erase' && isErasing) {
      eraseAtPoint(point);
      return;
    }

    if (tool === 'draw' && isDrawing) {
      setCurrentPath((prev) => [...prev, point]);
    }
  }, [isDrawing, isErasing, tool, blogMode, isExpanded, eraseAtPoint, draggingTextId, dragOffset]);

  const stopDrawing = useCallback(() => {
    // Stop dragging
    if (draggingTextId) {
      setDraggingTextId(null);
      setDragOffset(null);
      return;
    }

    if (tool === 'erase') {
      setIsErasing(false);
      return;
    }

    if (tool === 'draw' && isDrawing && currentPath.length > 0) {
      const newPath: Path = {
        points: currentPath,
        color: strokeColor,
        strokeWidth: strokeWidth,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      setPaths((prev) => [...prev, newPath]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath, strokeColor, strokeWidth, tool, draggingTextId]);

  const clear = () => {
    setPaths([]);
    setTextFields([]);
    setCurrentPath([]);
    setEditingTextId(null);
    localStorage.removeItem(storageKey);
  };


  const deleteTextField = (id: string) => {
    setTextFields((prev) => prev.filter((tf) => tf.id !== id));
    if (editingTextId === id) {
      setEditingTextId(null);
      setTextInput('');
    }
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };


  const generateSVGString = () => {
    const dims = getDrawingDimensions();
    const exportWidth = dims.width;
    const exportHeight = dims.height;

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", exportWidth.toString());
    svg.setAttribute("height", exportHeight.toString());
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Add background
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", exportWidth.toString());
    bgRect.setAttribute("height", exportHeight.toString());
    bgRect.setAttribute("fill", isDark ? "#000000" : "#ffffff");
    svg.appendChild(bgRect);

    // Add paths
    paths.forEach((path) => {
      const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const pathData = path.points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
      pathElement.setAttribute("d", pathData);
      pathElement.setAttribute("stroke", path.color);
      pathElement.setAttribute("stroke-width", path.strokeWidth.toString());
      pathElement.setAttribute("fill", "none");
      pathElement.setAttribute("stroke-linecap", "round");
      pathElement.setAttribute("stroke-linejoin", "round");
      svg.appendChild(pathElement);
    });

    // Add text fields
    textFields.forEach((textField) => {
      const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElement.setAttribute("x", textField.x.toString());
      textElement.setAttribute("y", textField.y.toString());
      textElement.setAttribute("fill", textField.color);
      textElement.setAttribute("font-size", textField.fontSize.toString());
      textElement.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace");
      textElement.textContent = textField.text;
      svg.appendChild(textElement);
    });

    // Serialize
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  };

  const handleSave = async () => {
    if (!saveFileName.trim()) {
      alert('Please enter a filename');
      return;
    }
    
    const fileName = saveFileName.endsWith('.svg') ? saveFileName : `${saveFileName}.svg`;
    const svgString = generateSVGString();

    try {
      // Try to save via API route
      const response = await fetch('/api/save-whiteboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svgContent: svgString,
          blogSlug: blogSlug,
          fileName: fileName,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store the saved filename
        setSavedFileName(fileName);
        setShowSaveDialog(false);
        alert(`File saved successfully to: public/images/posts/${blogSlug}/${fileName}\n\nUpdate your markdown to use:\n<Whiteboard src="${result.path}" blogMode={true} />\n\nThis will display the saved image instead of the interactive whiteboard.`);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error: any) {
      // Fallback to download if API fails
      console.warn('API save failed, falling back to download:', error);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `public/images/posts/${blogSlug}/${fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSavedFileName(fileName);
      setShowSaveDialog(false);
      alert(`API save failed. File downloaded instead.\n\nSave the file to: public/images/posts/${blogSlug}/${fileName}\n\nAfter saving, update your markdown to use:\n<Whiteboard src="/images/posts/${blogSlug}/${fileName}" blogMode={true} />`);
    }
  };

  const saveToProject = () => {
    if (!blogSlug) {
      alert('Blog slug is required to save to project.');
      return;
    }
    setShowSaveDialog(true);
    setSaveFileName(savedFileName || 'whiteboard.svg');
  };

  const undo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const exportSVG = () => {
    const activeSvg = (blogMode && isExpanded && fullSvgRef.current) ? fullSvgRef.current : svgRef.current;
    if (!activeSvg) return;

    // Always use expanded dimensions for consistent exports
    const dims = getDrawingDimensions();
    const exportWidth = dims.width;
    const exportHeight = dims.height;

    // Create a new SVG element with all paths
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", exportWidth.toString());
    svg.setAttribute("height", exportHeight.toString());
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Add background rectangle first
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", exportWidth.toString());
    bgRect.setAttribute("height", exportHeight.toString());
    bgRect.setAttribute("fill", isDark ? "#000000" : "#ffffff");
    svg.appendChild(bgRect);

    // Add all completed paths
    paths.forEach((path) => {
      const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const pathData = path.points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
      pathElement.setAttribute("d", pathData);
      pathElement.setAttribute("stroke", path.color);
      pathElement.setAttribute("stroke-width", path.strokeWidth.toString());
      pathElement.setAttribute("fill", "none");
      pathElement.setAttribute("stroke-linecap", "round");
      pathElement.setAttribute("stroke-linejoin", "round");
      svg.appendChild(pathElement);
    });

    // Add current path if drawing
    if (currentPath.length > 0) {
      const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const pathData = currentPath
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
      pathElement.setAttribute("d", pathData);
      pathElement.setAttribute("stroke", strokeColor);
      pathElement.setAttribute("stroke-width", strokeWidth.toString());
      pathElement.setAttribute("fill", "none");
      pathElement.setAttribute("stroke-linecap", "round");
      pathElement.setAttribute("stroke-linejoin", "round");
      svg.appendChild(pathElement);
    }

    // Add all text fields
    textFields.forEach((textField) => {
      const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElement.setAttribute("x", textField.x.toString());
      textElement.setAttribute("y", textField.y.toString());
      textElement.setAttribute("fill", textField.color);
      textElement.setAttribute("font-size", textField.fontSize.toString());
      textElement.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace");
      textElement.textContent = textField.text;
      svg.appendChild(textElement);
    });

    // Convert to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Download
    const link = document.createElement("a");
    link.href = url;
    link.download = `whiteboard-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const activeSvg = (blogMode && isExpanded && fullSvgRef.current) ? fullSvgRef.current : svgRef.current;
    if (!activeSvg) return;

    // Always use expanded dimensions for consistent exports
    const dims = getDrawingDimensions();
    const exportWidth = dims.width;
    const exportHeight = dims.height;

    // Create a canvas
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background based on theme
    ctx.fillStyle = isDark ? "#000000" : "#ffffff";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Draw all paths
    [...paths, ...(currentPath.length > 0 ? [{
      points: currentPath,
      color: strokeColor,
      strokeWidth: strokeWidth,
      id: "current"
    }] : [])].forEach((path) => {
      if (path.points.length === 0) return;
      
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      path.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    });

    // Draw all text fields
    ctx.font = `24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
    ctx.textBaseline = 'middle';
    textFields.forEach((textField) => {
      ctx.fillStyle = textField.color;
      ctx.font = `${textField.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
      ctx.fillText(textField.text, textField.x, textField.y);
    });

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `whiteboard-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  // Convert points to smooth path
  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    // Use quadratic curves for smoother lines
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      
      if (i === 1) {
        path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      } else {
        path += ` T ${midX} ${midY}`;
      }
    }
    
    // Add final point
    const last = points[points.length - 1];
    path += ` T ${last.x} ${last.y}`;
    
    return path;
  };

  // Render SVG paths and text fields (for preview and export)
  const renderSVGPaths = () => {
    const dims = getDrawingDimensions();
    return (
      <>
        {paths.map((path) => (
          <path
            key={path.id}
            d={pointsToPath(path.points)}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPath.length > 0 && (
          <path
            d={pointsToPath(currentPath)}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {textFields.map((textField) => {
          const isSelected = selectedTextId === textField.id;
          const isEditing = editingTextId === textField.id;
          const textWidth = Math.max(50, (textField.text.length || 1) * textField.fontSize * 0.6);
          return (
            <g key={textField.id}>
              {/* Selection border/feedback */}
              {(isSelected || isEditing) && (
                <rect
                  x={textField.x - 5}
                  y={textField.y - textField.fontSize / 2 - 5}
                  width={textWidth + 10}
                  height={textField.fontSize + 10}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.5"
                  style={{ cursor: isEditing ? 'default' : (moveMode ? 'move' : 'default') }}
                />
              )}
              {/* Delete button */}
              {isSelected && !isEditing && tool === 'text' && (
                <g>
                  <rect
                    x={textField.x + Math.max(50, (textField.text.length || 1) * textField.fontSize * 0.6) + 5}
                    y={textField.y - textField.fontSize / 2 - 8}
                    width="16"
                    height="16"
                    rx="2"
                    fill={isDark ? "#ff4444" : "#ff0000"}
                    stroke={isDark ? "#ffffff" : "#000000"}
                    strokeWidth="1"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTextField(textField.id);
                    }}
                  />
                  <text
                    x={textField.x + Math.max(50, (textField.text.length || 1) * textField.fontSize * 0.6) + 13}
                    y={textField.y - textField.fontSize / 2}
                    fill={isDark ? "#ffffff" : "#000000"}
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                    style={{ cursor: 'pointer', pointerEvents: 'none', fontWeight: 'bold' }}
                  >
                    ×
                  </text>
                </g>
              )}
              {/* Text element */}
              <text
                x={textField.x}
                y={textField.y}
                fill={textField.color}
                fontSize={textField.fontSize}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                style={{ cursor: moveMode ? 'move' : (tool === 'text' ? 'text' : 'pointer') }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (moveMode) {
                    // In move mode, clicking selects the text field for dragging
                    setSelectedTextId(textField.id);
                    return;
                  }
                  if (tool === 'text' && !isEditing) {
                    setEditingTextId(textField.id);
                    setTextInput(textField.text);
                    setSelectedTextId(textField.id);
                  }
                }}
              >
                {textField.text || (isEditing ? '' : '')}
              </text>
            </g>
          );
        })}
        {editingTextId && textFields.find(tf => tf.id === editingTextId) && (() => {
          const editingField = textFields.find(tf => tf.id === editingTextId)!;
          const dims = getDrawingDimensions();
          const minInputWidth = 200;
          const textBasedWidth = Math.max(100, (editingField.text.length || 1) * editingField.fontSize * 0.6) + 40;
          const inputWidth = Math.max(minInputWidth, textBasedWidth);
          
          // Position input starting at text position (not centered)
          // If text is near left edge, start at 0, otherwise start at text position
          let inputX = editingField.x;
          if (inputX < 10) {
            // Very close to left edge, start at 0
            inputX = 0;
          }
          
          // Ensure input doesn't go beyond right edge
          const maxX = dims.width - inputWidth;
          if (inputX > maxX) {
            inputX = Math.max(0, maxX);
          }
          
          const inputY = Math.max(0, Math.min(editingField.y - editingField.fontSize / 2 - 5, dims.height - editingField.fontSize - 10));
          const finalWidth = Math.min(inputWidth, dims.width - inputX);
          
          return (
            <foreignObject
              x={inputX}
              y={inputY}
              width={finalWidth}
              height={editingField.fontSize + 10}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setTextInput(newValue);
                    // Update text field in real-time
                    if (editingTextId) {
                      setTextFields((prev) =>
                        prev.map((tf) =>
                          tf.id === editingTextId
                            ? { ...tf, text: newValue }
                            : tf
                        )
                      );
                    }
                  }}
                  onBlur={finishTextEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      finishTextEditing();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingTextId(null);
                      setSelectedTextId(null);
                      setTextInput('');
                    } else if ((e.key === 'Delete' || e.key === 'Backspace') && textInput === '') {
                      e.preventDefault();
                      deleteTextField(editingTextId);
                    }
                  }}
                  placeholder="Type here..."
                  style={{
                    background: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${strokeColor}`,
                    color: strokeColor,
                    fontSize: editingField.fontSize,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    padding: '4px 8px',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    borderRadius: '2px',
                    boxShadow: `0 0 0 2px ${strokeColor}40`,
                  }}
                />
              </div>
            </foreignObject>
          );
        })()}
      </>
    );
  };

  // Blog mode: Show preview with expand button
  // If src is provided, show as static image instead of interactive whiteboard
  if (blogMode && !isExpanded) {
    if (src) {
      return (
        <div className={`bg-background ${className} not-prose`}>
          <img 
            src={src} 
            alt="Whiteboard drawing" 
            className="w-full h-auto"
            style={{ maxHeight: previewHeight, objectFit: 'contain' }}
          />
        </div>
      );
    }

    const dims = getDrawingDimensions();

    return (
      <div className={`bg-background ${className} not-prose`}>
        <div 
          className="relative w-full" 
          style={{ 
            height: previewHeight, 
            overflow: 'hidden',
            backgroundColor: isDark ? '#000000' : '#ffffff'
          }}
        >
          <svg
            className="block"
            viewBox={`0 0 ${dims.width} ${dims.height}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            {renderSVGPaths()}
          </svg>
          
          {/* Expand button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors group">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-3 border border-border bg-background/90 backdrop-blur-sm hover:bg-background transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100"
              title="Expand to draw"
            >
              <Maximize2 size={18} />
              <span className="text-sm font-mono">Draw</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full interactive whiteboard (normal mode or expanded blog mode)
  return (
    <>
      <div className={`bg-background ${className} ${blogMode ? 'not-prose' : ''}`}>
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-card">
          {blogMode && isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 border border-border hover:bg-muted transition-colors mr-2"
              title="Close"
            >
              <X size={16} />
            </button>
          )}

          {/* Tool selection */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
            <button
              onClick={() => setTool('draw')}
              className={`p-2 border transition-all ${tool === 'draw' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              title="Draw"
            >
              <span className="text-xs font-mono">Draw</span>
            </button>
            <button
              onClick={() => setTool('erase')}
              className={`p-2 border transition-all ${tool === 'erase' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              title="Eraser"
            >
              <Eraser size={14} />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 border transition-all ${tool === 'text' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              title="Text"
            >
              <Type size={14} />
            </button>
            <button
              onClick={() => {
                setMoveMode(!moveMode);
                if (moveMode) {
                  setTool('draw'); // Reset to draw when turning off move mode
                } else {
                  setTool('text'); // Switch to text tool when enabling move mode
                }
              }}
              className={`p-2 border transition-all ${moveMode ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
              title="Move Text"
            >
              <Move size={14} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-muted-foreground">Color:</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 cursor-pointer border border-border"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-muted-foreground">Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground w-6">{strokeWidth}</span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={undo}
              disabled={paths.length === 0}
              className="p-2 border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <RotateCcw size={16} />
            </button>
            
            <button
              onClick={clear}
              className="p-2 border border-border hover:bg-muted transition-colors"
              title="Clear"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={exportSVG}
              className="p-2 border border-border hover:bg-muted transition-colors flex items-center gap-1"
              title="Export as SVG"
            >
              <Download size={16} />
              <span className="text-xs font-mono">SVG</span>
            </button>

            <button
              onClick={exportPNG}
              className="p-2 border border-border hover:bg-muted transition-colors flex items-center gap-1"
              title="Export as PNG"
            >
              <Download size={16} />
              <span className="text-xs font-mono">PNG</span>
            </button>
            {blogMode && blogSlug && (
              <button
                onClick={saveToProject}
                className="p-2 border border-border hover:bg-muted transition-colors flex items-center gap-1"
                title="Save to project folder"
              >
                <Save size={16} />
                <span className="text-xs font-mono">Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Whiteboard */}
        <div 
          ref={containerRef}
          className="relative w-full" 
          style={{ 
            backgroundColor: isDark ? '#000000' : '#ffffff', 
            height: blogMode ? '600px' : `${height}px`,
            minHeight: blogMode ? '600px' : `${height}px`,
            width: '100%'
          }}
        >
          <svg
            ref={blogMode && isExpanded ? fullSvgRef : svgRef}
            className={moveMode ? "block cursor-move" : tool === 'text' ? "block cursor-text" : tool === 'erase' ? "block cursor-crosshair" : "block cursor-crosshair"}
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          >
            {renderSVGPaths()}
          </svg>
        </div>
      </div>

      {/* Fullscreen overlay for blog mode */}
      <AnimatePresence>
        {blogMode && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-2"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full relative bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Canvas area - full screen */}
              <div className="relative w-full h-full overflow-auto flex items-center justify-center" style={{ 
                backgroundColor: isDark ? '#000000' : '#ffffff'
              }}>
                <svg
                  ref={fullSvgRef}
                  className={moveMode ? "block cursor-move" : tool === 'text' ? "block cursor-text" : tool === 'erase' ? "block cursor-crosshair" : "block cursor-crosshair"}
                  viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                  preserveAspectRatio="none"
                  style={{ 
                    touchAction: "none",
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                >
                  {renderSVGPaths()}
                </svg>
              </div>

              {/* Floating controls on the right side */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 p-3 border border-primary/30 bg-background/95 backdrop-blur-sm w-48 z-10" style={{ borderWidth: '1px' }}>
                {/* Close button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary flex items-center justify-center"
                  title="Close (Esc)"
                >
                  <X size={14} />
                </button>

                {/* Tool selection */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-primary/20">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tool</label>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setTool('draw')}
                      className={`p-1.5 border transition-all uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-1 ${
                        tool === 'draw'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground/70 hover:text-primary'
                      }`}
                      title="Draw"
                    >
                      <span>Draw</span>
                    </button>
                    <button
                      onClick={() => setTool('erase')}
                      className={`p-1.5 border transition-all uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-1 ${
                        tool === 'erase'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground/70 hover:text-primary'
                      }`}
                      title="Eraser"
                    >
                      <Eraser size={12} />
                      <span>Erase</span>
                    </button>
                    <button
                      onClick={() => setTool('text')}
                      className={`p-1.5 border transition-all uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-1 ${
                        tool === 'text'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground/70 hover:text-primary'
                      }`}
                      title="Text"
                    >
                      <Type size={12} />
                      <span>Text</span>
                    </button>
                    <button
                      onClick={() => {
                        setMoveMode(!moveMode);
                        if (moveMode) {
                          setTool('draw');
                        } else {
                          setTool('text');
                        }
                      }}
                      className={`p-1.5 border transition-all uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-1 ${
                        moveMode
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground/70 hover:text-primary'
                      }`}
                      title="Move Text"
                    >
                      <Move size={12} />
                      <span>Move</span>
                    </button>
                  </div>
                </div>

                {/* Color picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Color</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-full h-8 cursor-pointer border border-primary/30 hover:border-primary transition-colors"
                    style={{ 
                      backgroundColor: strokeColor,
                    }}
                    title="Stroke color"
                  />
                </div>
                
                {/* Width slider */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Width</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full"
                    title="Stroke width"
                  />
                  <div className="px-2 py-1 border border-primary/30 bg-background text-center">
                    <span className="text-xs font-mono text-foreground font-bold">{strokeWidth}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-primary/20">
                  <button
                    onClick={undo}
                    disabled={paths.length === 0}
                    className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-primary/30 flex items-center justify-center gap-1"
                    title="Undo"
                  >
                    <RotateCcw size={12} />
                    <span>Undo</span>
                  </button>
                  
                  <button
                    onClick={clear}
                    className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary flex items-center justify-center gap-1"
                    title="Clear"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>

                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-primary/20">
                    <button
                      onClick={exportSVG}
                      className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary flex items-center justify-center gap-1"
                      title="Export as SVG"
                    >
                      <Download size={12} />
                      <span>SVG</span>
                    </button>

                    <button
                      onClick={exportPNG}
                      className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary flex items-center justify-center gap-1"
                      title="Export as PNG"
                    >
                      <Download size={12} />
                      <span>PNG</span>
                    </button>
                    {blogMode && blogSlug && (
                      <button
                        onClick={saveToProject}
                        className="p-1.5 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all uppercase tracking-wider text-[10px] font-bold text-foreground/70 hover:text-primary flex items-center justify-center gap-1"
                        title="Save to project folder"
                      >
                        <Save size={12} />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-primary/30 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-foreground">Save Whiteboard</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Filename (will be saved to: <code className="text-primary">public/images/posts/{blogSlug}/</code>)
                  </label>
                  <input
                    type="text"
                    value={saveFileName}
                    onChange={(e) => setSaveFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-primary/30 bg-background text-foreground font-mono"
                    placeholder="whiteboard.svg"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSave();
                      } else if (e.key === 'Escape') {
                        setShowSaveDialog(false);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 border border-primary/30 hover:bg-primary/10 transition-colors text-sm font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 border border-primary bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-mono text-primary font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


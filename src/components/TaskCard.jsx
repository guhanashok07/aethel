import React from 'react';

const ALLOWED_TAGS = ['B', 'STRONG', 'I', 'EM', 'U'];

const sanitizeHTML = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const cleanNode = (node) => {
        const children = Array.from(node.childNodes);
        children.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (ALLOWED_TAGS.includes(child.nodeName)) {
                    // Remove all attributes (style, class, events, etc.) to prevent XSS
                    while (child.attributes.length > 0) {
                        child.removeAttribute(child.attributes[0].name);
                    }
                    cleanNode(child);
                } else {
                    // Replace other element nodes with their plain text equivalent
                    const textNode = document.createTextNode(child.textContent);
                    child.parentNode.replaceChild(textNode, child);
                }
            }
        });
    };

    cleanNode(temp);
    return temp.innerHTML;
};

export default function TaskCard({ task, onDragStart, onDragEnd, onUpdateText, onComplete }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));
        selection.collapseToEnd();
    };

    const handleBlur = (e) => {
        const sanitized = sanitizeHTML(e.target.innerHTML);
        // Only trigger update if content actually changed
        if (sanitized !== task.text) {
            onUpdateText(task.id, sanitized);
        }
    };

    return (
        <div
            id={task.id}
            className="task-card group p-2 bg-[#ffffff] border border-black/5 hover:border-black/10 transition-all mb-1"
            draggable={true}
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
        >
            <div
                className="editable-text pr-6 text-stone-800"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: task.text }}
            />
            <div className="task-checkbox-wrapper opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onComplete(task.id)}
                    className="task-checkbox"
                >
                    <div className="task-checkbox-inner"></div>
                </button>
            </div>
        </div>
    );
}

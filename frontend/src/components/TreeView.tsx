import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  FolderGit2,
  CheckCircle2,
  Clock,
  PlusCircle,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { Node } from '../api/client';

interface TreeViewProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode: (node: Node) => void;
  onRequestChildNode?: (parentNode: Node) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onRequestChildNode,
}) => {
  // Build a tree hierarchy mapping
  const buildTree = (items: Node[]) => {
    const map = new Map<string, Node & { children: any[] }>();
    const roots: (Node & { children: any[] })[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const treeData = buildTree(nodes);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {treeData.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderGit2 size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No nodes registered yet in this hierarchy.</p>
        </div>
      ) : (
        treeData.map((rootNode) => (
          <TreeNodeItem
            key={rootNode.id}
            node={rootNode}
            level={0}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            onRequestChildNode={onRequestChildNode}
          />
        ))
      )}
    </div>
  );
};

interface TreeNodeItemProps {
  node: Node & { children?: (Node & { children?: any[] })[] };
  level: number;
  selectedNodeId: string | null;
  onSelectNode: (node: Node) => void;
  onRequestChildNode?: (parentNode: Node) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  selectedNodeId,
  onSelectNode,
  onRequestChildNode,
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = node.id === selectedNodeId;

  return (
    <div style={{ marginLeft: `${level * 20}px`, marginTop: '4px' }}>
      <div
        onClick={() => onSelectNode(node)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(30, 41, 59, 0.5)',
          border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div style={{ width: '16px' }} />
          )}

          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(51, 65, 85, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}
          >
            <Building2 size={16} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {node.role}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: node.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: node.status === 'active' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                {node.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <IndianRupee size={12} />
                Allocated: <strong>₹{Number(node.allocated_budget).toLocaleString()}</strong>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Path: {node.path}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRequestChildNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestChildNode(node);
              }}
              title="Request sub-node allocation"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            >
              <PlusCircle size={13} />
              <span>Add Child</span>
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ borderLeft: '1px dashed rgba(255, 255, 255, 0.1)', marginLeft: '16px', paddingLeft: '8px' }}>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={0}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onRequestChildNode={onRequestChildNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

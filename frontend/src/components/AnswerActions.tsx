import { useState } from 'react';
import { Tooltip, message } from 'antd';
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, Square } from 'lucide-react';
import { api } from '../api';

interface Props {
  text: string;
  module: string;
  sessionId?: string;
  loading?: boolean;
  onRetry?: () => void;
  onAbort?: () => void;
}

export default function AnswerActions({ text, module, sessionId, loading, onRetry, onAbort }: Props) {
  const [rated, setRated] = useState<0 | 1 | -1>(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择');
    }
  };

  const rate = async (v: 1 | -1) => {
    try {
      await api.post('/chat/feedback', { module, session_id: sessionId || '', rating: v });
      setRated(v);
      message.success(v > 0 ? '感谢反馈，已点赞' : '感谢反馈，将用于改进');
    } catch {
      // interceptor 已弹错
    }
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {loading ? (
        <Tooltip title="停止生成">
          <button className="action-btn" onClick={onAbort}>
            <Square size={14} /> 停止
          </button>
        </Tooltip>
      ) : (
        <>
          <Tooltip title="复制">
            <button className="action-btn" onClick={copy} disabled={!text}>
              <Copy size={14} />
            </button>
          </Tooltip>
          {onRetry && (
            <Tooltip title="重试">
              <button className="action-btn" onClick={onRetry}>
                <RotateCcw size={14} />
              </button>
            </Tooltip>
          )}
          <Tooltip title="点赞">
            <button
              className={`action-btn ${rated === 1 ? 'active' : ''}`}
              onClick={() => rate(1)}
              disabled={!text}
            >
              <ThumbsUp size={14} />
            </button>
          </Tooltip>
          <Tooltip title="点踩">
            <button
              className={`action-btn ${rated === -1 ? 'active danger' : ''}`}
              onClick={() => rate(-1)}
              disabled={!text}
            >
              <ThumbsDown size={14} />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
}

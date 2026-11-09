import React from 'react';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldVersionNum: number;
  newVersionNum: number;
}

interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

// Compute simple word-level diff
function computeWordDiff(oldStr: string, newStr: string): DiffToken[] {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const diff: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      diff.push({ type: 'added', value: newWords[j] });
      j++;
    } else if (j >= newWords.length) {
      diff.push({ type: 'removed', value: oldWords[i] });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      diff.push({ type: 'unchanged', value: oldWords[i] });
      i++;
      j++;
    } else {
      // Lookahead check
      const nextInNew = newWords.indexOf(oldWords[i], j);
      const nextInOld = oldWords.indexOf(newWords[j], i);

      if (nextInNew !== -1 && (nextInOld === -1 || nextInNew - j < nextInOld - i)) {
        while (j < nextInNew) {
          diff.push({ type: 'added', value: newWords[j] });
          j++;
        }
      } else if (nextInOld !== -1) {
        while (i < nextInOld) {
          diff.push({ type: 'removed', value: oldWords[i] });
          i++;
        }
      } else {
        diff.push({ type: 'removed', value: oldWords[i] });
        diff.push({ type: 'added', value: newWords[j] });
        i++;
        j++;
      }
    }
  }

  return diff;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  oldVersionNum,
  newVersionNum
}) => {
  const diffTokens = computeWordDiff(oldText, newText);

  const addedCount = diffTokens.filter(t => t.type === 'added' && t.value.trim().length > 0).length;
  const removedCount = diffTokens.filter(t => t.type === 'removed' && t.value.trim().length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800">Visual Revision Comparison:</span>
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            v{oldVersionNum} (Original)
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            v{newVersionNum} (Revision)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-medium">
          <span className="text-rose-600 font-bold">-{removedCount} words removed</span>
          <span className="text-emerald-600 font-bold">+{addedCount} words corrected</span>
        </div>
      </div>

      <div className="p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
        {diffTokens.map((token, idx) => {
          if (token.type === 'added') {
            return (
              <span
                key={idx}
                className="bg-emerald-100 text-emerald-950 px-1 py-0.5 rounded font-semibold border-b-2 border-emerald-500 mx-0.5"
                title="Added in revision"
              >
                {token.value}
              </span>
            );
          }
          if (token.type === 'removed') {
            return (
              <span
                key={idx}
                className="bg-rose-100 text-rose-800 line-through px-1 py-0.5 rounded opacity-70 mx-0.5"
                title="Removed from previous version"
              >
                {token.value}
              </span>
            );
          }
          return <span key={idx}>{token.value}</span>;
        })}
      </div>
    </div>
  );
};


import { useRef, useState } from 'react';
import type { HistoryState } from '../features/cleaning/types';
import { createRecipe, parseRecipe, replayRecipe } from '../features/cleaning/recipe';
import type { Recipe } from '../features/cleaning/recipe';
import { downloadBlob, filenameStem } from '../lib/format';

export function useRecipeTransfer({
  history,
  revision,
  isCurrentRevision,
  applyReplayedHistory,
  notify,
}: {
  history: HistoryState | null;
  revision: number;
  isCurrentRevision(revision: number): boolean;
  applyReplayedHistory(history: HistoryState, revision: number): boolean;
  notify(text: string, error?: boolean): void;
}) {
  const [recipeBusy, setRecipeBusy] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState<{
    history: HistoryState;
    recipe: Recipe;
    revision: number;
    filename: string;
  } | null>(null);
  const request = useRef(0);

  async function exportRecipe() {
    if (!history) return;
    try {
      const recipe = await createRecipe(history);
      downloadBlob(
        JSON.stringify(recipe, null, 2),
        `${filenameStem(history.original.metadata.filename || '实验数据')}-清洗配置.json`,
        'application/json;charset=utf-8',
      );
      notify(`已导出 ${recipe.operations.length} 步清洗配置及结果校验信息。`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '处理配置导出失败。', true);
    }
  }

  async function importRecipe(file: File) {
    if (!history) {
      notify('请先导入配置对应的原始数据文件。', true);
      return;
    }
    const id = ++request.current;
    const source = history.original;
    const sourceRevision = revision;
    setRecipeBusy(true);
    setPendingRecipe(null);
    try {
      const recipe = parseRecipe(await file.text());
      const replayed = await replayRecipe(source, recipe);
      if (id !== request.current) return;
      if (!isCurrentRevision(sourceRevision))
        throw new Error('工作区在校验期间发生变化，请重新导入处理配置。');
      setPendingRecipe({
        history: replayed,
        recipe,
        revision: sourceRevision,
        filename: file.name,
      });
    } catch (error) {
      if (id === request.current)
        notify(error instanceof Error ? error.message : '处理配置导入失败。', true);
    } finally {
      if (id === request.current) setRecipeBusy(false);
    }
  }

  function confirmRecipe() {
    if (!pendingRecipe) return;
    const replayed = {
      ...pendingRecipe.history,
      replay: {
        loadedAt: new Date().toISOString(),
        configName: pendingRecipe.filename,
        generatedAt: pendingRecipe.recipe.generatedAt,
      },
    };
    const accepted = applyReplayedHistory(replayed, pendingRecipe.revision);
    setPendingRecipe(null);
    notify(
      accepted
        ? `已回放 ${replayed.cursor} 步操作，结果指纹校验通过。`
        : '工作区已发生变化，请重新预览配置。',
      !accepted,
    );
  }

  return {
    recipeBusy,
    pendingRecipe,
    exportRecipe,
    importRecipe,
    confirmRecipe,
    closeRecipe: () => setPendingRecipe(null),
  };
}

import { useDataImport } from './useDataImport';
import { useNotice } from './useNotice';
import { useCleaningHistory } from './useCleaningHistory';
import { useRecipeTransfer } from './useRecipeTransfer';

export function useWorkbench() {
  const notice = useNotice();
  const cleaning = useCleaningHistory(notice.notify);
  const imports = useDataImport(cleaning.acceptDataset, notice.notify);
  const recipes = useRecipeTransfer({
    history: cleaning.history,
    revision: cleaning.revision,
    isCurrentRevision: cleaning.isCurrentRevision,
    applyReplayedHistory: cleaning.applyReplayedHistory,
    notify: notice.notify,
  });
  return { ...notice, ...cleaning, ...imports, ...recipes };
}

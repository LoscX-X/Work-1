import { useDataImport } from './useDataImport';
import { useNotice } from './useNotice';
import { useCleaningHistory } from './useCleaningHistory';

export function useWorkbench() {
  const notice = useNotice();
  const cleaning = useCleaningHistory(notice.notify);
  const imports = useDataImport(cleaning.acceptDataset, notice.notify);
  return { ...notice, ...cleaning, ...imports };
}

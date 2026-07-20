import {COPY} from '../content/copy';

type ScopeNoticeProps = {
  compact?: boolean;
};

export function ScopeNotice({compact = false}: ScopeNoticeProps) {
  return (
    <aside className={compact ? 'scope-notice scope-notice--compact' : 'scope-notice'}>
      <p>{COPY.scope.official}</p>
      {!compact && <p className="scope-notice__hosting">{COPY.scope.hosting}</p>}
    </aside>
  );
}

import {COPY} from '../content/copy';

type ScopeNoticeProps = {
  compact?: boolean;
};

export function ScopeNotice({compact = false}: ScopeNoticeProps) {
  return (
    <aside className={compact ? 'scope-notice scope-notice--compact' : 'scope-notice'}>
      <p>{COPY.scope.official}</p>
      {!compact && (
        <div className="scope-notice__actions">
          <details>
            <summary>데모 안내</summary>
            <p>{COPY.scope.detail}</p>
          </details>
          <details>
            <summary>호스팅 안내</summary>
            <p>{COPY.scope.hosting}</p>
          </details>
        </div>
      )}
    </aside>
  );
}

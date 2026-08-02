type EntityProtectionPanelProps = {
  protectedText?: string;
  visible: boolean;
  requestBlocked: boolean;
};

export function EntityProtectionPanel({protectedText, visible, requestBlocked}: EntityProtectionPanelProps) {
  return (
    <section className="protected-comparison" data-testid="protected-comparison" aria-labelledby="protected-comparison-title">
      <div className="compact-heading">
        <strong id="protected-comparison-title">보호문 비교</strong>
        <span>{visible ? requestBlocked ? '요청 멈춤' : '보호됨' : '대기'}</span>
      </div>
      {visible ? (
        requestBlocked ? (
          <p className="protected-comparison__message">지원 범위를 확인해 보호된 요청을 만들지 않았습니다.</p>
        ) : (
          <p className="protected-text">{protectedText}</p>
        )
      ) : (
        <p className="protected-comparison__message">합성 개인정보를 찾은 뒤 보호된 문장을 여기에 표시합니다.</p>
      )}
    </section>
  );
}

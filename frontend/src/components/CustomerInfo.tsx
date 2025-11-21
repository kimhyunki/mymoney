import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/api';
import type { Customer } from '@/types';

function CustomerInfo() {
  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchInterval: 30000, // 30초마다 자동 갱신 (스케줄러와 동기화)
  });

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          고객정보
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          고객정보
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186, 26, 26, 0.9)' }}>
          고객정보를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          고객정보
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 고객정보가 없습니다.
        </p>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-sm)' }}>
          엑셀 파일을 업로드하면 고객정보가 자동으로 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-light-surface-container)',
        borderRadius: 'var(--md-radius-lg)',
        border: '1px solid var(--md-sys-light-outline-variant)',
        padding: 'var(--md-space-lg)',
        boxShadow: 'var(--md-shadow-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--md-space-md)' }}>
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          고객정보
        </h2>
        <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          총 {customers.length}명
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
        {customers.map((customer) => (
          <div
            key={customer.id}
            style={{
              border: '1px solid var(--md-sys-light-outline-variant)',
              borderRadius: 'var(--md-radius-lg)',
              padding: 'var(--md-space-md)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
              e.currentTarget.style.boxShadow = 'var(--md-shadow-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-md)' }}>
                  <h3 style={{ font: 'var(--md-body-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
                    {customer.name}
                  </h3>
                  {customer.gender && (
                    <span
                      style={{
                        padding: 'var(--md-space-xs) var(--md-space-sm)',
                        font: 'var(--md-label-small)',
                        backgroundColor: 'var(--md-sys-light-secondary-container)',
                        color: 'var(--md-sys-light-on-secondary-container)',
                        borderRadius: 'var(--md-radius-sm)',
                      }}
                    >
                      {customer.gender}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-space-md)', font: 'var(--md-body-medium)' }}>
                  {customer.age !== null && (
                    <div>
                      <span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>나이:</span>
                      <span style={{ marginLeft: 'var(--md-space-sm)', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)' }}>
                        {customer.age}세
                      </span>
                    </div>
                  )}
                  
                  {customer.credit_score !== null && (
                    <div>
                      <span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>신용점수:</span>
                      <span style={{ marginLeft: 'var(--md-space-sm)', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)' }}>
                        {customer.credit_score.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {customer.email && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>이메일:</span>
                      <span style={{ marginLeft: 'var(--md-space-sm)', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)' }}>
                        {customer.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  등록일: {new Date(customer.created_at).toLocaleString('ko-KR')}
                </span>
                {customer.updated_at !== customer.created_at && (
                  <span>
                    최종 업데이트: {new Date(customer.updated_at).toLocaleString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          고객정보는 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default CustomerInfo;


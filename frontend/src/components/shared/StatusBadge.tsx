interface Props {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-primary-100 text-primary-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-primary-100 text-primary-800',
  CANCELLED: 'bg-red-100 text-red-800',
  OVERLOADED: 'bg-red-100 text-red-800',
  UNDERLOADED: 'bg-yellow-100 text-yellow-800',
  NORMAL: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
  OVERLOADED: 'O',
  UNDERLOADED: 'U',
  NORMAL: 'N',
};

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] ?? status.replace('_', ' ');
  return (
    <span className={`badge ${style}`}>
      {label}
    </span>
  );
}

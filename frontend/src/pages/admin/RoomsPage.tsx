import { PageHeader } from '../../components/shared/PageHeader';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  X,
  Save,
  Pencil,
  Trash2,
  Monitor,
  BookOpen,
  Users,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { roomsApi } from '../../api/rooms.api';
import { CustomDropdown } from '../../components/shared/CustomDropdown';

interface Room {
  id: string;
  code: string;
  number: string;
  capacity: number;
  building: string;
  buildingNo?: string;
  roomType: string;
  description?: string;
  isAvailable: boolean;
  department?: { id: string; name: string };
}

const ROOM_TYPES = [
  'LECTURE_HALL',
  'SEMINAR_ROOM',
  'COMPUTER_LAB',
  'CHEMISTRY_LAB',
  'PHYSICS_LAB',
  'CONFERENCE_HALL',
  'ACTIVE_LEARNING',
  'HYBRID',
];

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  LECTURE_HALL:    { label: 'Lecture Hall',    color: 'bg-primary-100 text-primary-700' },
  SEMINAR_ROOM:    { label: 'Seminar Room',    color: 'bg-green-100 text-green-700' },
  COMPUTER_LAB:    { label: 'Computer Lab',    color: 'bg-purple-100 text-purple-700' },
  CHEMISTRY_LAB:   { label: 'Chemistry Lab',   color: 'bg-orange-100 text-orange-700' },
  PHYSICS_LAB:     { label: 'Physics Lab',     color: 'bg-yellow-100 text-yellow-700' },
  CONFERENCE_HALL: { label: 'Conference Hall', color: 'bg-indigo-100 text-indigo-700' },
  ACTIVE_LEARNING: { label: 'Active Learning', color: 'bg-teal-100 text-teal-700' },
  HYBRID:          { label: 'Hybrid',          color: 'bg-gray-100 text-gray-600' },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  LECTURE_HALL:    BookOpen,
  SEMINAR_ROOM:    Users,
  COMPUTER_LAB:    Monitor,
  CHEMISTRY_LAB:   Building2,
  PHYSICS_LAB:     Building2,
  CONFERENCE_HALL: Users,
  ACTIVE_LEARNING: BookOpen,
  HYBRID:          Building2,
};

export default function RoomsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxAction, setCheckboxAction] = useState<'delete' | 'available' | 'unavailable' | null>(null);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function enterSelectMode(action: 'delete' | 'available' | 'unavailable') {
    setCheckboxAction(action); setShowCheckboxes(true); setSelectedIds(new Set());
  }
  function cancelSelectMode() { setShowCheckboxes(false); setCheckboxAction(null); setSelectedIds(new Set()); }

  function handleBulkToggle(isAvailable: boolean) {
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => roomsApi.update(id, { isAvailable })))
      .then(() => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success(`${selectedIds.size} room(s) updated`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to update'))
      .finally(() => setBulkPending(false));
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} selected room(s)?`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => roomsApi.remove(id)))
      .then(() => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success(`${selectedIds.size} room(s) deleted`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', filterType, filterBuilding],
    queryFn: () =>
      roomsApi.getAll({
        roomType: filterType || undefined,
        building: filterBuilding || undefined,
      }),
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () =>
      import('../../api/client').then(({ default: api }) =>
        api.get('/departments', { params: { limit: 100 } }).then((r) => r.data.data),
      ),
  });

  const rooms: Room[] = data?.data ?? [];

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.number.toLowerCase().includes(q) ||
      (r.building && r.building.toLowerCase().includes(q))
    );
  });

  const buildings = [...new Set(rooms.map((r) => r.building).filter(Boolean))];

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.isAvailable).length,
    busy: rooms.filter((r) => !r.isAvailable).length,
    lectureHalls: rooms.filter((r) => r.roomType === 'LECTURE_HALL').length,
    seminarRooms: rooms.filter((r) => r.roomType === 'SEMINAR_ROOM').length,
    computerLabs: rooms.filter((r) => r.roomType === 'COMPUTER_LAB').length,
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader icon={<Building2 />} title={t('roomsManagement')} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditRoom(null); setShowPanel(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('addRoom')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Rooms</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Lecture Halls</p>
          <p className="text-2xl font-bold mt-1 text-primary-600">{stats.lectureHalls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Seminar Rooms</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.seminarRooms}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Computer Labs</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{stats.computerLabs}</p>
        </div>
        {/* Room Capacity — real-time busy vs available */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-3 lg:col-span-1 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-500 mb-2">Room Capacity</p>
          <div className="flex items-center justify-center gap-3">
            <div>
              <p className="text-xl font-bold text-red-600">{stats.busy}</p>
              <p className="text-[10px] text-gray-400">Busy</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-xl font-bold text-green-600">{stats.available}</p>
              <p className="text-[10px] text-gray-400">Available</p>
            </div>
          </div>
          {stats.total > 0 && (
            <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.round((stats.available / stats.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number or building..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Types</option>
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_CONFIG[t]?.label ?? t}</option>
          ))}
        </select>
        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {(search || filterType || filterBuilding) && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterBuilding(''); }}
            className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {showCheckboxes && (
        <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-700">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select rooms to ${checkboxAction}`}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {checkboxAction === 'available' && (
              <button onClick={() => handleBulkToggle(true)} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50">
                <ToggleRight className="w-3.5 h-3.5" /> Set Available {selectedIds.size > 0 ? selectedIds.size : ''}
              </button>
            )}
            {checkboxAction === 'unavailable' && (
              <button onClick={() => handleBulkToggle(false)} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50">
                <ToggleLeft className="w-3.5 h-3.5" /> Set Unavailable {selectedIds.size > 0 ? selectedIds.size : ''}
              </button>
            )}
            {checkboxAction === 'delete' && (
              <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size > 0 ? selectedIds.size : ''}
              </button>
            )}
            <button onClick={cancelSelectMode}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Room table */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Building2 className="w-10 h-10 mb-2 opacity-30" />
              <p>No rooms found</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                <tr>
                  {showCheckboxes && (
                    <th className="px-2 py-2.5 text-center border-r border-gray-200">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(new Set(filtered.map((r) => r.id)));
                          else setSelectedIds(new Set());
                        }}
                        className="rounded"
                      />
                    </th>
                  )}
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Room No.</th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Type</th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Building</th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Capacity</th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Status</th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((room) => {
                  const typeConfig = TYPE_CONFIG[room.roomType] ?? { label: room.roomType, color: 'bg-gray-100 text-gray-600' };
                  const TypeIcon = TYPE_ICONS[room.roomType] ?? Building2;
                  return (
                    <tr key={room.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${showCheckboxes && selectedIds.has(room.id) ? 'bg-primary-50' : ''}`}>
                      {showCheckboxes && (
                        <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(room.id)}
                            onChange={() => toggleSelect(room.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{room.number}</p>
                            {room.code && <p className="text-xs">{room.code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                        {room.building}{room.buildingNo ? ` — Block ${room.buildingNo}` : ''}
                      </td>
                      <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
                          {room.capacity} seats
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-[11px] whitespace-nowrap border-r border-gray-200">
                        {room.isAvailable ? (
                          <span className="text-green-600 font-medium">Available</span>
                        ) : (
                          <span className="text-gray-400">Busy</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center border-r border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditRoom(room); setShowPanel(true); }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { enterSelectMode('delete'); setSelectedIds(new Set([room.id])); }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Side panel */}
        {showPanel && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto">
            <RoomForm
              room={editRoom}
              departments={deptData ?? []}
              onClose={() => { setShowPanel(false); setEditRoom(null); }}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ['rooms'] });
                toast.success(editRoom ? t('roomUpdated') : t('roomCreated'));
                setShowPanel(false);
                setEditRoom(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RoomForm({
  room,
  departments,
  onClose,
  onSaved,
}: {
  room: Room | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const getDefaultForm = (r: Room | null) =>
    r
      ? {
          code: r.code,
          number: r.number,
          capacity: r.capacity,
          building: r.building ?? '',
          buildingNo: r.buildingNo ?? '',
          roomType: r.roomType,
          description: r.description ?? '',
          isAvailable: r.isAvailable,
          departmentId: r.department?.id ?? '',
        }
      : {
          number: '',
          capacity: 30,
          building: '',
          buildingNo: '',
          roomType: 'SEMINAR_ROOM',
          description: '',
          isAvailable: true,
          departmentId: '',
        };

  const [form, setForm] = useState<Record<string, unknown>>(() => getDefaultForm(room));

  useEffect(() => {
    setForm(getDefaultForm(room));
  }, [room]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined || value === '') continue;
        payload[key] = value;
      }
      if (payload.buildingNo !== undefined) {
        const n = Number(payload.buildingNo);
        if (!Number.isInteger(n)) delete payload.buildingNo;
        else payload.buildingNo = n;
      }
      // Backend requires code — auto-generate from room number if not already set
      if (!payload.code && payload.number) {
        payload.code = String(payload.number);
      }
      return room ? roomsApi.update(room.id, payload) : roomsApi.create(payload);
    },
    onSuccess: onSaved,
    onError: (err: any) => {
      const detail = err?.response?.data?.details?.fieldErrors;
      const msg = detail
        ? Object.entries(detail).map(([f, m]: any) => `${f}: ${m[0]}`).join(', ')
        : err?.response?.data?.message || 'Error saving room';
      toast.error(msg);
    },
  });

  const field = (key: string, label: string, type = 'text') => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key] ?? '')}
        onChange={(e) =>
          setForm((p) => ({ ...p, [key]: type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value }))
        }
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">{room ? t('editRoom') : t('addRoom')}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {field('number', `${t('roomNumber')} *`)}
        {field('capacity', `${t('capacity')} *`, 'number')}
        {field('building', `${t('building')} *`)}
        {field('buildingNo', t('buildingBlock'))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('roomType')} *</label>
          <CustomDropdown
            value={String(form.roomType ?? '')}
            onChange={(v) => setForm((p) => ({ ...p, roomType: v }))}
            options={ROOM_TYPES.map((t) => ({ value: t, label: TYPE_CONFIG[t]?.label ?? t }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('description')}</label>
          <textarea
            rows={2}
            value={String(form.description ?? '')}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('departmentOptional')}</label>
          <CustomDropdown
            value={String(form.departmentId ?? '')}
            onChange={(v) => setForm((p) => ({ ...p, departmentId: v }))}
            options={[
              { value: '', label: t('none') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAvailable"
            checked={Boolean(form.isAvailable)}
            onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isAvailable" className="text-sm text-gray-700">{t('available')}</label>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button
          onClick={() => {
            if (!form.number || String(form.number).trim() === '') {
              toast.error('Room number is required');
              return;
            }
            if (!form.capacity || Number(form.capacity) <= 0) {
              toast.error('Capacity must be a positive number');
              return;
            }
            if (!form.building || String(form.building).trim() === '') {
              toast.error('Building is required');
              return;
            }
            if (!form.roomType || String(form.roomType).trim() === '') {
              toast.error('Room type is required');
              return;
            }
            mutation.mutate(form);
          }}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? t('saving') : room ? t('edit') : t('add')}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

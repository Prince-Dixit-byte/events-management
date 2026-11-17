import { useState } from 'react';
import type { EventPayload } from '../types';

const EVENT_CATEGORIES = [
  'Technical',
  'Workshop',
  'Seminar',
  'Competition',
  'Placement',
  'Cultural',
  'Sports',
];

interface EventFormProps {
  initialValues?: EventPayload;
  submitLabel: string;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (payload: EventPayload) => Promise<void>;
  onCancel: () => void;
}

export function EventForm({
  initialValues,
  submitLabel,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [eventDate, setEventDate] = useState(initialValues?.eventDate || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '10:00');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '12:00');
  const [capacity, setCapacity] = useState(String(initialValues?.capacity ?? 50));
  const [category, setCategory] = useState(initialValues?.category || 'Technical');
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const mergedErrors = { ...clientErrors, ...serverErrors };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = 'Event title cannot be empty.';
    if (!description.trim()) errs.description = 'Description cannot be empty.';
    if (!location.trim()) errs.location = 'Location cannot be empty.';
    if (!eventDate) errs.eventDate = 'Please select a valid event date.';
    if (!startTime) errs.startTime = 'Start time is required.';
    if (!endTime) errs.endTime = 'End time is required.';
    if (startTime && endTime && endTime <= startTime) {
      errs.endTime = 'End time must be strictly after start time.';
    }
    const capNum = Number(capacity);
    if (!Number.isInteger(capNum) || capNum <= 0) {
      errs.capacity = 'Capacity must be a positive whole number.';
    }

    setClientErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      eventDate,
      startTime,
      endTime,
      capacity: capNum,
      category,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="event-title" className="block text-sm font-medium text-slate-800">
            Event title
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Cloud & Distributed Systems Symposium"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.title ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.title}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-description" className="block text-sm font-medium text-slate-800">
            Description
          </label>
          <textarea
            id="event-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the agenda, speakers, prerequisites, and target student audience."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.description ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.description}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-slate-800">
            Campus location
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Main Auditorium A1"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.location ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.location}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-category" className="block text-sm font-medium text-slate-800">
            Category
          </label>
          <select
            id="event-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          >
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {mergedErrors.category ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.category}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-slate-800">
            Event date
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.eventDate ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.eventDate}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-capacity" className="block text-sm font-medium text-slate-800">
            Maximum capacity
          </label>
          <input
            id="event-capacity"
            type="number"
            min={1}
            step={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.capacity ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.capacity}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-start" className="block text-sm font-medium text-slate-800">
            Start time
          </label>
          <input
            id="event-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.startTime ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.startTime}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="event-end" className="block text-sm font-medium text-slate-800">
            End time
          </label>
          <input
            id="event-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          {mergedErrors.endTime ? (
            <p className="mt-1 text-xs text-rose-600">{mergedErrors.endTime}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#0F2942] px-5 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

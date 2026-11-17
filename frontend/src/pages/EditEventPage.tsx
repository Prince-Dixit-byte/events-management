import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { eventsApi, extractErrorMessage, extractFieldErrors } from '../services/api';
import type { EventItem, EventPayload } from '../types';

export function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    eventsApi
      .getById(id)
      .then(setEvent)
      .catch((err) => setLoadError(extractErrorMessage(err, 'Failed to load event.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (payload: EventPayload) => {
    if (!id) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await eventsApi.update(id, payload);
      showSuccess(res.message);
      navigate(`/events/${res.event.id}`);
    } catch (err) {
      setServerErrors(extractFieldErrors(err));
      showError(extractErrorMessage(err, 'Failed to update event.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Edit Event" breadcrumb="Administration / Events / Edit">
      {loading ? (
        <LoadingState rows={4} />
      ) : loadError || !event ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {loadError || 'Event not found.'}
        </div>
      ) : (
        <div className="max-w-3xl">
          <EventForm
            initialValues={{
              title: event.title,
              description: event.description,
              location: event.location,
              eventDate: event.eventDate,
              startTime: event.startTime,
              endTime: event.endTime,
              capacity: event.capacity,
              category: event.category,
            }}
            submitLabel="Save Changes"
            submitting={submitting}
            serverErrors={serverErrors}
            onSubmit={handleUpdate}
            onCancel={() => navigate(`/events/${event.id}`)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}

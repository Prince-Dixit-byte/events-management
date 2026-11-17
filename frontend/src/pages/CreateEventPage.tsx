import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { eventsApi, extractErrorMessage, extractFieldErrors } from '../services/api';
import type { EventPayload } from '../types';

export function CreateEventPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const handleCreate = async (payload: EventPayload) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await eventsApi.create(payload);
      showSuccess(res.message);
      navigate(`/events/${res.event.id}`);
    } catch (err) {
      setServerErrors(extractFieldErrors(err));
      showError(extractErrorMessage(err, 'Failed to create event.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create New Event" breadcrumb="Administration / Events / New">
      <div className="max-w-3xl">
        <EventForm
          submitLabel="Publish Event"
          submitting={submitting}
          serverErrors={serverErrors}
          onSubmit={handleCreate}
          onCancel={() => navigate('/admin/dashboard')}
        />
      </div>
    </DashboardLayout>
  );
}

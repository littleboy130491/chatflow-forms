/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Field, Notice, Select } from '../builder/controls';
import { errorMessage } from '../builder/api';
import type { AdminApi } from '../builder/api';
import { Filters } from './Filters';
import type { PurgeCriteria, PurgeJob, PurgePreview, Status } from './model';
import { useJobProgress } from './useJobProgress';
export function Purge({ api }: { api: AdminApi }) {
  const [criteria, setCriteria] = useState<PurgeCriteria>({ olderThanDays: 360 }),
    [preview, setPreview] = useState<PurgePreview | null>(null),
    [confirmation, setConfirmation] = useState(''),
    [job, setJob] = useState<PurgeJob | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const refresh = useJobProgress<{ id: string; status: PurgeJob['status']; deleted: number }>(
    api,
    job ? `admin/purge/${job.jobId}` : null,
    job?.status,
    (result) => setJob((current) => (current ? { ...current, ...result } : null)),
    (err) => setError(errorMessage(err)),
  );
  const change = (next: PurgeCriteria) => {
    setCriteria(next);
    setPreview(null);
    setConfirmation('');
  };
  return (
    <section className="cff-card">
      <h1>{__('Purge submissions', 'chatflow-forms')}</h1>
      <Notice status="warning" isDismissible={false}>
        {__(
          'Permanently deletes matching data in bounded batches. This cannot be undone. Preview first.',
          'chatflow-forms',
        )}
      </Notice>
      <Notice status="warning" isDismissible={false}>
        {__('A matching purge-preview CSV snapshot is not available. Export each affected form separately before deleting; ordinary exports are not an exact preview backup when rows change.', 'chatflow-forms')}
      </Notice>
      <fieldset disabled={busy}>
        <Select
          label={__('Status', 'chatflow-forms')}
          value={criteria.status ?? ''}
          choices={[
            { value: '', label: __('All statuses', 'chatflow-forms') },
            ...['completed', 'partial', 'abandoned', 'spam', 'trash'].map((value) => ({
              value,
              label: value,
            })),
          ]}
          onChange={(status) => {
            const next = { ...criteria };
            if (status) next.status = status as Status;
            else delete next.status;
            change(next);
          }}
        />
        <Filters value={criteria} onChange={change} purge />
        <Field
          label={__('Older than days (default 360 unless dates set)', 'chatflow-forms')}
          type="number"
          value={criteria.olderThanDays ?? ''}
          onChange={(value) => {
            const next = { ...criteria };
            if (value) next.olderThanDays = Number(value);
            else delete next.olderThanDays;
            change(next);
          }}
        />
        <p>{__('Associated private files are deleted together with submissions.', 'chatflow-forms')}</p>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            setPreview(null);
            try {
              setPreview(await api.request<PurgePreview>('admin/purge/preview', 'POST', { criteria }));
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {__('Preview count', 'chatflow-forms')}
        </Button>
        {preview && (
          <div>
            <p>
              {sprintf(
                __('%d submissions and %d files match.', 'chatflow-forms'),
                preview.count,
                preview.fileCount,
              )}
            </p>
            <Field
              label={__('Type DELETE to confirm', 'chatflow-forms')}
              value={confirmation}
              onChange={setConfirmation}
            />
            <Button
              isDestructive
              disabled={busy || confirmation !== 'DELETE'}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  setJob(
                    await api.request<PurgeJob>('admin/purge', 'POST', {
                      criteria,
                      confirmationToken: preview.confirmationToken,
                      confirmation,
                    }),
                  );
                  setPreview(null);
                  setConfirmation('');
                } catch (err) {
                  setError(errorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {__('Permanently purge', 'chatflow-forms')}
            </Button>
          </div>
        )}
      </fieldset>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {job && (
        <p role="status">
          {__('Purge job', 'chatflow-forms')}: {job.jobId} · {job.status} · {job.deleted ?? 0}
        </p>
      )}
      {job && ['queued', 'running'].includes(job.status) && (
        <Button onClick={refresh}>{__('Refresh progress', 'chatflow-forms')}</Button>
      )}
    </section>
  );
}

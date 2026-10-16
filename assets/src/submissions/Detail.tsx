/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { interpolate } from '../shared/logic/index';
import type { AnswerMap } from '../shared/contracts';
import { Area, Button, Notice, Select } from '../builder/controls';
import { can, errorMessage } from '../builder/api';
import type { AdminApi } from '../builder/api';
import { displayValue, statuses, statusLabel } from './model';
import type { Status, SubmissionDetail, SubmissionDTO } from './model';
import { downloadUpload, storedIp, uploadIds } from './downloads';
export interface Activity {
  deliveries: {
    id: number;
    channel: string;
    destination_id: string;
    status: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
  }[];
  items: { id: number; type: string; body: string; created_at: string }[];
  page: number;
  perPage: number;
}
function DeliveryActivity({ api, id }: { api: AdminApi; id: number }) {
  const [activity, setActivity] = useState<Activity | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () =>
    api
      .request<Activity>(`admin/submissions/${id}/activity`)
      .then(setActivity)
      .catch((err) => setError(errorMessage(err)));
  useEffect(() => {
    void load();
  }, [api, id]);
  return (
    <section className="cff-card">
      <h2>{__('Delivery activity', 'chatflow-forms')}</h2>
      <Button
        onClick={() => {
          void load();
        }}
      >
        {__('Refresh activity', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      <table className="widefat">
        <thead>
          <tr>
            <th>{__('Destination', 'chatflow-forms')}</th>
            <th>{__('Status / attempts', 'chatflow-forms')}</th>
            <th>{__('Action', 'chatflow-forms')}</th>
          </tr>
        </thead>
        <tbody>
          {activity?.deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>
                {delivery.channel} / {delivery.destination_id}
              </td>
              <td>
                {delivery.status} / {delivery.attempts}
                <p>{delivery.last_error ?? ''}</p>
              </td>
              <td>
                {can(api.config, 'edit_submissions') && (
                  <Button
                    disabled={busy || !['failed', 'sent'].includes(delivery.status)}
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        await api.request(`admin/submissions/${id}/retry`, 'POST', {
                          deliveryId: delivery.id,
                        });
                        await load();
                      } catch (err) {
                        setError(errorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {__('Retry delivery', 'chatflow-forms')}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul>
        {activity?.items.map((note) => (
          <li key={note.id}>
            {note.created_at}: {note.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
export function Detail({
  api,
  id,
  onClose,
  onChanged,
  previous, next, onNavigate,
}: {
  api: AdminApi;
  id: number;
  onClose: () => void;
  onChanged: () => void;
  previous?: number | undefined; next?: number | undefined; onNavigate: (id: number) => void;
}) {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null),
    [error, setError] = useState(''),
    [note, setNote] = useState(''),
    [view, setView] = useState('qa'),
    [busy, setBusy] = useState(false);
  const load = () =>
    api
      .request<SubmissionDetail>(`admin/submissions/${id}`)
      .then(setDetail)
      .catch((err) => setError(errorMessage(err)));
  useEffect(() => {
    void load();
  }, [api, id]);
  const update = async (
    changes: Partial<Pick<SubmissionDTO, 'isRead' | 'isStarred' | 'status'>> & { note?: string },
  ) => {
    setBusy(true);
    setError('');
    try {
      await api.request<SubmissionDTO>(`admin/submissions/${id}`, 'PATCH', changes);
      await load();
      onChanged();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="cff-detail">
      <Button onClick={onClose}>{__('Back to submissions', 'chatflow-forms')}</Button>
      <Button disabled={!previous} onClick={() => { if (previous) onNavigate(previous); }}>{__('Previous', 'chatflow-forms')}</Button>
      <Button disabled={!next} onClick={() => { if (next) onNavigate(next); }}>{__('Next', 'chatflow-forms')}</Button>
      <Button onClick={() => window.print()}>{__('Print', 'chatflow-forms')}</Button>
      {detail?.status === 'completed' && can(api.config, 'edit_submissions') && <Button disabled={busy} onClick={async () => {
        if (!window.confirm(__('Resend all matching notifications for this completed submission?', 'chatflow-forms'))) return;
        setBusy(true); setError('');
        try { await api.request(`admin/submissions/${id}/resend`, 'POST', { requestId: crypto.randomUUID() }); await load(); }
        catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
      }}>{__('Resend notifications', 'chatflow-forms')}</Button>}
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {detail && (
        <Fragment>
          <h1>
            {detail.form?.title ?? __('Submission', 'chatflow-forms')} · {detail.uuid}
          </h1>
          <p>
            {detail.createdAt} · {detail.status} · {__('Form version', 'chatflow-forms')} {detail.formVersion}{' '}
            · {Math.round(detail.durationMs / 1000)}s · {detail.progress}%
          </p>
          {can(api.config, 'edit_submissions') && (
            <div className="cff-toolbar">
              <Button
                disabled={busy}
                onClick={() => {
                  void update({ isRead: !detail.isRead });
                }}
              >
                {detail.isRead ? __('Mark unread', 'chatflow-forms') : __('Mark read', 'chatflow-forms')}
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  void update({ isStarred: !detail.isStarred });
                }}
              >
                {detail.isStarred ? __('Unstar', 'chatflow-forms') : __('Star', 'chatflow-forms')}
              </Button>
              <Select
                label={__('Status', 'chatflow-forms')}
                value={detail.status}
                choices={statuses
                  .filter((value) => value !== 'trash' || value === detail.status || can(api.config, 'delete_submissions'))
                  .map((value) => ({ value, label: statusLabel(value) }))}
                onChange={(status) => {
                  if (status === detail.status) return;
                  if (!window.confirm(sprintf(__('Change this submission to “%s”?', 'chatflow-forms'), statusLabel(status)))) return;
                  void update({ status: status as Status });
                }}
              />
            </div>
          )}
          <nav className="cff-tabs">
            {[
              { value: 'qa', label: __('Plain Q&A', 'chatflow-forms') },
              { value: 'replay', label: __('Conversation replay', 'chatflow-forms') },
              { value: 'meta', label: __('Metadata and consent', 'chatflow-forms') },
              { value: 'activity', label: __('Activity', 'chatflow-forms') },
            ].map((item) => (
              <Button key={item.value} onClick={() => setView(item.value)}>
                {item.label}
              </Button>
            ))}
          </nav>
          {!detail.form && (
            <Notice status="warning" isDismissible={false}>
              {__('The frozen form snapshot is unavailable.', 'chatflow-forms')}
            </Notice>
          )}
          {view === 'qa' && (
            <dl>
              {detail.form?.schema.steps
                .filter(
                  (step) =>
                    detail.visited.includes(step.id) &&
                    Object.prototype.hasOwnProperty.call(detail.answers, step.key),
                )
                .map((step) => (
                  <Fragment key={step.id}>
                    <dt>
                      {step.label} <code>{step.key}</code>
                    </dt>
                    <dd>{displayValue(detail.answers[step.key]) || '—'}
                      {step.type === 'file_upload' && can(api.config, 'view_submissions') && uploadIds(detail.answers[step.key]).map(uuid => <Button key={uuid} disabled={busy} onClick={async () => { setBusy(true); try { await downloadUpload(api, uuid); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); } }}>{__('Download attached file', 'chatflow-forms')}</Button>)}
                    </dd>
                  </Fragment>
                ))}
            </dl>
          )}
          {view === 'replay' && (
            <ol className="cff-replay">
              {detail.visited.map((stepId) => {
                const step = detail.form?.schema.steps.find((item) => item.id === stepId);
                return step ? (
                  <li key={stepId}>
                    <div className="cff-bot">
                      {step.messages.map((message, index) => (
                        <p key={index}>
                          {interpolate(message, detail.answers as AnswerMap, detail.meta as AnswerMap)}
                        </p>
                      ))}
                    </div>
                    {Object.prototype.hasOwnProperty.call(detail.answers, step.key) && (
                      <div className="cff-answer">
                        {displayValue(detail.answers[step.key]) || __('Skipped', 'chatflow-forms')}
                      </div>
                    )}
                  </li>
                ) : null;
              })}
            </ol>
          )}
          {view === 'meta' && (
            <Fragment>
              <h2>{__('Collected metadata', 'chatflow-forms')}</h2>
              {storedIp(detail.meta) && <p><code>{storedIp(detail.meta)}</code> <Button onClick={async () => { try { await navigator.clipboard.writeText(storedIp(detail.meta)!); } catch (error) { setError(errorMessage(error)); } }}>{__('Copy stored IP', 'chatflow-forms')}</Button></p>}
              <pre>{JSON.stringify(detail.meta, null, 2)}</pre>
              <h2>{__('Recorded consent text and version', 'chatflow-forms')}</h2>
              <pre>{JSON.stringify(detail.consent, null, 2)}</pre>
            </Fragment>
          )}
          {view === 'activity' && <DeliveryActivity api={api} id={id} />}
          <section className="cff-card">
            <h2>{__('Notes', 'chatflow-forms')}</h2>
            <ul>
              {detail.notes.map((item) => (
                <li key={item.id}>
                  {item.createdAt} · {item.kind}: {item.message}
                </li>
              ))}
            </ul>
            {can(api.config, 'edit_submissions') && (
              <Fragment>
                <Area
                  label={__('Add private plain-text note', 'chatflow-forms')}
                  value={note}
                  onChange={setNote}
                />
                <Button
                  disabled={busy || !note.trim()}
                  onClick={async () => {
                    if (await update({ note })) setNote('');
                  }}
                >
                  {__('Add note', 'chatflow-forms')}
                </Button>
              </Fragment>
            )}
          </section>
          {can(api.config, 'delete_submissions') && (
            <Button
              isDestructive
              disabled={busy}
              onClick={async () => {
                if (window.confirm(__('Trash this submission?', 'chatflow-forms'))) {
                  try {
                    await api.request(`admin/submissions/${id}`, 'DELETE');
                    onChanged();
                    onClose();
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                }
              }}
            >
              {__('Trash submission', 'chatflow-forms')}
            </Button>
          )}
        </Fragment>
      )}
    </section>
  );
}

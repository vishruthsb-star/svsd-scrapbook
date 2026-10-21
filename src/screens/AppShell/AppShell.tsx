import type { ReactNode, TransitionEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_IMAGE_SRCS } from '@/scrapbook/fixtures/sampleItems';
import CanvasScreen from '@/screens/CanvasScreen/CanvasScreen';
import ComposeMemoryScreen from '@/screens/ComposeMemoryScreen/ComposeMemoryScreen';
import type { ComposeKind, ComposedMemory } from '@/screens/ComposeMemoryScreen/ComposeMemoryScreen';
import type { AddFabKind } from '@/components/AddFab';
import { CURRENT_USER_ID, LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_NAME, SCRAPBOOK_COVERS } from '@/data/mock';
import type { PlacedMemory } from '@/scrapbook/placement';
import { clearUserMemories, deleteMemory, loadMemories, saveMemory } from '@/scrapbook/persistence/localScrapbookStore';
import HomeScreenShell from '@/screens/HomeScreen/HomeScreenShell';
import { decodeImages } from '@/utils/decodeImages';
import { clearBoopStamps, loadBoopStamps, saveBoopStamps } from '@/scrapbook/boopStamps';
import { canonicalBoopsFor, canonicalMemoriesFor, DEFAULT_PRESENTATION_BY_PERSON } from '@/scrapbook/fixtures/canonicalMemories';
import { boopTargetId } from '@/scrapbook/placement/dynamicLayout';
import type { PlacedBoopStamp, BoopStampKey } from '@/scrapbook/boopStamps';
import MailboxScreen from '@/screens/MailboxScreen/MailboxScreen';
import type { MailboxNotification } from '@/data/mailboxNotifications';
import InvitationScreen from '@/screens/InvitationScreen/InvitationScreen';
import { ScrapbookProfileScreen } from '@/screens/ScrapbookProfileScreen';
import { isScrapbookPresentation, PRESENTATION_TO_CANVAS_STYLE, profileContributorsFor } from '@/data/scrapbookProfile';
import type { ScrapbookContributor, ScrapbookPresentation } from '@/types';
import { deriveScrapbookPermissions } from '@/scrapbook/permissions';
import './AppShell.css';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function presentationStorageKey(scrapbookId: string) {
  return `scrapbook-profile:${scrapbookId}:presentation`;
}
const DEFAULT_DATASET_VERSION = 3;
const DATASET_VERSION_KEY = 'scrapbook-canonical-dataset-version';

/**
 * Versioned, narrowly-scoped migration for the prior shipped presentation defaults.
 * It touches only the seven known scrapbook preference keys and never IndexedDB/user
 * memories. Once version 3 is recorded, later manual profile selections are untouched.
 */
function migratePresentationDefaults() {
  try {
    if (Number(window.localStorage.getItem(DATASET_VERSION_KEY)) >= DEFAULT_DATASET_VERSION) return;
    const people = [OWNER_NAME.toLowerCase(), ...LIBRARY_PEOPLE.map(({ name }) => name)];
    for (const person of people) {
      window.localStorage.setItem(presentationStorageKey(`library:${person}`), presentationForPerson(`library:${person}`));
    }
    window.localStorage.setItem(DATASET_VERSION_KEY, String(DEFAULT_DATASET_VERSION));
  } catch { /* Storage is optional in the prototype. */ }
}

function presentationForPerson(scrapbookId: string): ScrapbookPresentation {
  const person = scrapbookId.replace(/^library:/, '');
  const style = DEFAULT_PRESENTATION_BY_PERSON[person] ?? 'torn-strata';
  return style === 'paper-wheel' ? 'wheel' : style === 'envelopes-lip' ? 'envelope' : style === 'theme-spreads' ? 'cover' : 'canvas';
}

function loadPresentation(scrapbookId: string): ScrapbookPresentation {
  try {
    const saved = window.localStorage.getItem(presentationStorageKey(scrapbookId));
    return isScrapbookPresentation(saved) ? saved : presentationForPerson(scrapbookId);
  } catch {
    return presentationForPerson(scrapbookId);
  }
}

interface ScreenPanelProps {
  active: boolean;
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * One tab's content, kept permanently mounted (never remounted on switch — see CanvasScreen,
 * whose ResizeObserver/font-ready measurements would otherwise have to redo themselves) and
 * stacked (position:absolute, inset:0) so outgoing and incoming overlap during the crossfade
 * instead of leaving a gap.
 *
 * `active` drives the fade via the `.is-active` class (opacity 0<->1, ~280ms). Crucially,
 * `visibility: hidden` + `inert` + `aria-hidden` — the things that actually remove a panel
 * from paint/hit-testing/the a11y tree — are only applied once the exit transition's
 * `transitionend` fires, never synchronously with the tab switch. Applying them immediately
 * (the previous bug: the `hidden` attribute, which forces `display: none` the instant React
 * sets it) is what made the outgoing screen vanish in a single frame with no fade at all.
 *
 * The one-shot "entering" animation (fade + 8px rise) is applied imperatively via
 * classList/animationend rather than React state, so it plays exactly once per switch and
 * never re-fires on an unrelated re-render while a panel stays active. It's skipped on this
 * component's very first mount (`isFirstRun`) so the screen that's active on initial load
 * (Home) doesn't visibly rise into place.
 */
function ScreenPanel({ active, id, labelledBy, className, children }: ScreenPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);
  const [idleHidden, setIdleHidden] = useState(!active);
  const [prevActive, setPrevActive] = useState(active);

  // React's documented render-time "adjust state when a prop changes" pattern (not an
  // effect — it runs synchronously within this render, before paint) instead of a
  // useLayoutEffect setState call: an element can't visibly fade in while
  // visibility:hidden, so clearing idleHidden has to land in the SAME commit that
  // `active` flips true, not a commit after it. Mirrored for reduced motion, where no
  // transitionend will ever fire to flip idleHidden back on (see handleTransitionEnd).
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setIdleHidden(false);
    else if (prefersReducedMotion()) setIdleHidden(true);
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;
    if (!active || firstRun || prefersReducedMotion()) return;

    el.classList.remove('is-entering');
    void el.offsetWidth; // force reflow so re-adding the class restarts the keyframe animation
    el.classList.add('is-entering');
    const onDone = () => el.classList.remove('is-entering');
    el.addEventListener('animationend', onDone, { once: true });
    return () => el.removeEventListener('animationend', onDone);
  }, [active]);

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'opacity') return;
    if (!active) setIdleHidden(true);
  };

  const classes = [
    'app-shell-screen',
    className,
    active ? 'is-active' : null,
    idleHidden ? 'is-idle-hidden' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      id={id}
      className={classes}
      role="tabpanel"
      aria-labelledby={labelledBy}
      aria-hidden={idleHidden ? true : undefined}
      inert={idleHidden ? true : undefined}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}

export default function AppShell() {
  migratePresentationDefaults();
  const [openedScrapbook, setOpenedScrapbook] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(LIBRARY_ACTIVE_INDEX);
  const [composeKind, setComposeKind] = useState<ComposeKind | null>(null);
  const [createdItems, setCreatedItems] = useState<PlacedMemory[]>([]);
  const [boopStamps, setBoopStamps] = useState<PlacedBoopStamp[]>(() => loadBoopStamps());
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const [presentations, setPresentations] = useState<Record<string, ScrapbookPresentation>>({});
  const [contributors, setContributors] = useState<Record<string, readonly ScrapbookContributor[]>>({});
  const [coverImages, setCoverImages] = useState<Record<string, string>>({});
  const [, setBoopPickerOpen] = useState(false);
  const savingRef = useRef(false);
  const coverUrlsRef = useRef<Record<string, string>>({});
  // Folder selection is a Home-only interaction. Keep the permanently mounted, hidden
  // canvas bound to a stable recipient until a scrapbook is actually opened; otherwise
  // every tab click needlessly rebuilds the canvas's heavyweight SVG layout.
  const recipientName = openedScrapbook === 'own' ? OWNER_NAME.toLowerCase() : openedScrapbook ?? LIBRARY_PEOPLE[LIBRARY_ACTIVE_INDEX].name;
  const recipient = { name: recipientName };
  const scrapbookId = `library:${recipient.name}`;
  const permissions = deriveScrapbookPermissions(CURRENT_USER_ID, recipient.name);
  const coverImage = coverImages[recipient.name] ?? SCRAPBOOK_COVERS[recipient.name];
  const presentation = presentations[scrapbookId] ?? loadPresentation(scrapbookId);
  const defaultContributors = profileContributorsFor(recipient.name);
  const visibleContributors = contributors[scrapbookId] ?? defaultContributors;

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      setComposeKind(null);
      setProfileOpen(false);
      if (event.state?.scrapbookScreen) {
        const id = event.state.scrapbookId as string | undefined;
        setOpenedScrapbook(id === 'own' ? 'own' : id?.replace(/^library:/, '') ?? null);
      } else setOpenedScrapbook(null);
      setMailboxOpen(event.state?.mailboxScreen === true);
      setInvitationOpen(event.state?.invitationScreen === true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => () => {
    Object.values(coverUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const openOwnScrapbook = useCallback(() => {
    setComposeKind(null);
    setBoopPickerOpen(false);
    window.history.pushState({ scrapbookScreen: true, scrapbookId: 'own' }, '');
    setOpenedScrapbook('own');
  }, []);
  const openPersonScrapbook = useCallback((index: number) => {
    setComposeKind(null);
    setBoopPickerOpen(false);
    setSelectedPerson(index);
    window.history.pushState({ scrapbookScreen: true, scrapbookId: `library:${LIBRARY_PEOPLE[index].name}` }, '');
    setOpenedScrapbook(LIBRARY_PEOPLE[index].name);
  }, []);
  /**
   * The canvas header has an explicit destination: Home.  It must not behave like a
   * browser Back affordance, because a prior history entry can be another scrapbook
   * (or Mailbox).  Replace the current canvas entry with Home instead of adding a new
   * entry, so repeated visits do not create a Back-loop and subsequent browser history
   * navigation still restores a state represented by its own entry.
   */
  const navigateHome = useCallback(() => {
    setComposeKind(null);
    setProfileOpen(false);
    setMailboxOpen(false);
    setInvitationOpen(false);
    setScrollTargetId(null);
    setBoopPickerOpen(false);
    setOpenedScrapbook(null);
    window.history.replaceState({ appScreen: 'home' }, '');
  }, []);
  const openProfile = useCallback(() => {
    if (!openedScrapbook) return;
    window.history.pushState({ scrapbookProfile: true, scrapbookId: openedScrapbook }, '');
    setProfileOpen(true);
  }, [openedScrapbook]);
  const closeProfile = () => {
    if (window.history.state?.scrapbookProfile) window.history.back();
    else setProfileOpen(false);
  };
  const selectPresentation = (next: ScrapbookPresentation) => {
    if (!permissions.canChangePresentation) return;
    // An insertion reveal belongs to the canvas where it was made; do not replay it after a presentation switch.
    setScrollTargetId(null);
    setPresentations((current) => ({ ...current, [scrapbookId]: next }));
    try { window.localStorage.setItem(presentationStorageKey(scrapbookId), next); } catch { /* Storage is optional in the prototype. */ }
  };
  const removeContributor = (id: string) => {
    if (!permissions.canManageContributors) return;
    setContributors((current) => ({ ...current, [scrapbookId]: (current[scrapbookId] ?? defaultContributors).filter((person) => person.id !== id || person.permission === 'owner') }));
  };
  const inviteContributor = () => {
    if (!permissions.canInviteContributors) return;
    const enteredName = window.prompt('Add a local demo participant');
    const name = enteredName?.trim().toLowerCase();
    if (!name) return;
    setContributors((current) => {
      const existing = current[scrapbookId] ?? defaultContributors;
      if (existing.some((person) => person.name === name)) return current;
      const colors = ['#C9D9F4', '#F6E3B4', '#D6C9F0', '#C5E8D9'];
      const next: ScrapbookContributor = { id: `local-${Date.now()}`, name, permission: 'can write', fill: colors[existing.length % colors.length], rotation: existing.length % 2 === 0 ? 1 : -1 };
      return { ...current, [scrapbookId]: [...existing, next] };
    });
  };
  const updateCoverImage = (file: File) => {
    if (!permissions.canEditProfile) return;
    const previous = coverUrlsRef.current[recipient.name];
    if (previous) URL.revokeObjectURL(previous);
    const next = URL.createObjectURL(file);
    coverUrlsRef.current[recipient.name] = next;
    setCoverImages((current) => ({ ...current, [recipient.name]: next }));
  };
  const openMailbox = () => {
    window.history.pushState({ mailboxScreen: true }, '');
    setMailboxOpen(true);
  };
  const returnFromMailbox = () => {
    if (window.history.state?.mailboxScreen) window.history.back();
    else setMailboxOpen(false);
  };
  const openMailboxNotification = (notification: MailboxNotification) => {
    if (notification.target.kind === 'invitation') return;
    const owner = notification.target.scrapbookOwnerId;
    const itemId = notification.target.kind === 'scrapbook-item' ? notification.target.itemId : null;
    window.history.pushState({ scrapbookScreen: true, returnTo: 'mailbox', scrapbookId: owner }, '');
    setScrollTargetId(itemId);
    setMailboxOpen(false);
    setOpenedScrapbook(owner === OWNER_NAME.toLowerCase() ? 'own' : owner);
  };

  useEffect(() => {
    let cancelled = false;
    loadMemories(recipient.name).then((items) => {
      if (!cancelled) setCreatedItems(items);
    }).catch((error: unknown) => console.warn('Could not restore scrapbook memories', error));
    return () => { cancelled = true; };
  }, [recipient.name]);

  const openCompose = useCallback((kind: AddFabKind) => {
    if (composeKind || !permissions.canAddMemories) return;
    window.history.pushState({ scrapbookCompose: true, scrapbookId: `library:${recipient.name}` }, '');
    setComposeKind(kind);
  }, [composeKind, permissions.canAddMemories, recipient.name]);
  const closeCompose = () => {
    if (window.history.state?.scrapbookCompose) window.history.back();
    else setComposeKind(null);
  };
  const completeCompose = async (memory: ComposedMemory) => {
    if (savingRef.current || !permissions.canAddMemories) return;
    savingRef.current = true;
    const id = crypto.randomUUID();
    const seed = [...id].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) | 0, 17);
    const base = { id, scrapbookId: `library:${recipient.name}`, recipientId: recipient.name, authorId: 'prototype-contributor', createdAt: new Date().toISOString(), seed };
    const mediaKey = memory.kind === 'stamp' || memory.kind === 'voice' ? `media:${id}` : undefined;
    const item: PlacedMemory = memory.kind === 'stamp' ? { ...base, kind: 'stamp', text: memory.caption, src: URL.createObjectURL(memory.file), mediaKey, ratio: memory.ratio } : memory.kind === 'note' ? { ...base, kind: 'note', text: memory.text } : memory.kind === 'tag' ? { ...base, kind: 'tag', text: memory.title, url: memory.url } : { ...base, kind: 'voice', src: URL.createObjectURL(memory.blob), mediaKey, durationSec: memory.durationSec };
    try {
      await saveMemory(item, memory.kind === 'stamp' ? memory.file : memory.kind === 'voice' ? memory.blob : undefined);
      setCreatedItems((items) => [...items, item]);
      setScrollTargetId(item.id);
      closeCompose();
    } catch (error) {
      console.error('Could not save scrapbook memory', error);
      window.alert("Couldn't save this memory. Please try again.");
    } finally { savingRef.current = false; }
  };
  const addBoopStamp = useCallback((stampKey: BoopStampKey, position: { x: number; y: number }) => {
    if (!permissions.canBoop) return;
    const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `boop-${Date.now()}-${boopStamps.length}`;
    const stamp: PlacedBoopStamp = { id, stampKey, stampDesignId: stampKey, recipientBookId: `library:${recipient.name}`, senderId: CURRENT_USER_ID, x: position.x, y: position.y, width: 136, rotation: ((boopStamps.length * 5) % 11) - 5, createdAt: new Date().toISOString() };
    setBoopStamps((current) => { const next = [...current, stamp]; saveBoopStamps(next); return next; });
    setScrollTargetId(boopTargetId(stamp.id));
  }, [boopStamps.length, permissions.canBoop, recipient.name]);

  const canvasItems = useMemo(
    () => [...canonicalMemoriesFor(recipient.name), ...createdItems.filter((item) => item.recipientId === recipient.name)],
    [createdItems, recipient.name],
  );
  const canvasBoopStamps = useMemo(
    () => [...canonicalBoopsFor(recipient.name), ...boopStamps.filter((stamp) => stamp.recipientBookId === `library:${recipient.name}`)],
    [boopStamps, recipient.name],
  );
  const removeCanvasItem = useCallback(async (id: string) => {
    if (!permissions.canRemoveItems) return;
    const item = createdItems.find((candidate) => candidate.id === id && candidate.recipientId === recipient.name);
    if (!item) return;
    try {
      await deleteMemory(item);
      setCreatedItems((current) => current.filter((candidate) => candidate.id !== id));
    } catch (error) {
      console.error('Could not remove scrapbook memory', error);
      window.alert("Couldn't remove this memory. Please try again.");
    }
  }, [createdItems, permissions.canRemoveItems, recipient.name]);
  const handleScrollTargetHandled = useCallback((id: string) => {
    setScrollTargetId((current) => current === id ? null : current);
  }, []);

  // Deliberately development-only and invisible in the product UI. In a dev console,
  // `await window.resetScrapbookDemo()` clears only the prototype's memories, BOOPs, and
  // presentation choices; the authored canonical records above are never stored or deleted.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as typeof window & { resetScrapbookDemo?: () => Promise<void> };
    target.resetScrapbookDemo = async () => {
      await clearUserMemories();
      clearBoopStamps();
      for (const person of [OWNER_NAME.toLowerCase(), ...LIBRARY_PEOPLE.map(({ name }) => name)]) {
        try { window.localStorage.removeItem(presentationStorageKey(`library:${person}`)); } catch { /* optional storage */ }
      }
      setCreatedItems([]);
      setBoopStamps([]);
      setPresentations({});
      setScrollTargetId(null);
    };
    return () => { delete target.resetScrapbookDemo; };
  }, []);

  // Pre-decode the canvas screen's photos while Home is still showing, so the first switch
  // to Journal doesn't stall on JPEG decode (the canvas panel is mounted from the start but
  // stays visibility:hidden/inert until first activated — see ScreenPanel above and
  // utils/decodeImages.ts).
  useEffect(() => {
    decodeImages(SAMPLE_IMAGE_SRCS);
  }, []);

  return (
    <div className="app-shell-root">
      <ScreenPanel active={openedScrapbook === null && !mailboxOpen && !invitationOpen} id="panel-home" labelledBy="home-screen" className="app-shell-home">
        <HomeScreenShell selectedPerson={selectedPerson} coverImages={coverImages} onSelectPerson={setSelectedPerson} onOpenOwnScrapbook={openOwnScrapbook} onOpenPersonScrapbook={openPersonScrapbook} onOpenMailbox={openMailbox} />
      </ScreenPanel>
      <ScreenPanel active={mailboxOpen} id="panel-mailbox" labelledBy="mailbox-screen" className="app-shell-home">
        <MailboxScreen onBack={returnFromMailbox} onOpenNotification={openMailboxNotification} />
      </ScreenPanel>
      <ScreenPanel active={invitationOpen} id="panel-invitation" labelledBy="invitation-screen" className="app-shell-home">
        <InvitationScreen inviterName="varun" onBack={() => window.history.back()} />
      </ScreenPanel>
      <ScreenPanel active={openedScrapbook !== null && !profileOpen} id="panel-scrapbook" labelledBy="scrapbook-screen" className="app-shell-canvas">
        <CanvasScreen recipientName={recipient.name} boopSenderName={CURRENT_USER_ID} coverImage={coverImage} style={PRESENTATION_TO_CANVAS_STYLE[presentation]} permissions={permissions} onBack={navigateHome} onProfileOpen={openProfile} onAddSelect={openCompose} items={canvasItems} boopStamps={canvasBoopStamps} onBoopSelect={addBoopStamp} onRemoveItem={removeCanvasItem} scrollTargetId={scrollTargetId} onScrollTargetHandled={handleScrollTargetHandled} onBoopOpenChange={setBoopPickerOpen} />
      </ScreenPanel>
      <ScreenPanel active={openedScrapbook !== null && profileOpen} id="panel-scrapbook-profile" labelledBy="scrapbook-profile-screen" className="app-shell-profile">
        <ScrapbookProfileScreen ownerName={recipient.name} presentation={presentation} contributors={visibleContributors} coverImage={coverImage} permissions={permissions} onBack={closeProfile} onPresentationChange={selectPresentation} onContributorRemove={removeContributor} onInvite={inviteContributor} onCoverFileChange={updateCoverImage} />
      </ScreenPanel>
      {composeKind && (
        <div className="app-shell-compose" role="dialog" aria-modal="true" aria-label={`Compose memory for ${recipient.name}`}>
          <ComposeMemoryScreen kind={composeKind} recipientName={recipient.name} onClose={closeCompose} onComplete={completeCompose} showDevTabs={false} />
        </div>
      )}
    </div>
  );
}

import { createClient } from './client';
import { Attributes, CharacterAppearance, EquippedGear, PlayableHeroClass } from '@/lib/game/items';
import { StableState } from '@/lib/game/pets';
import { HeroMetrics } from '@/lib/game/achievements';
import { StudyEntry } from '@/components/StudyLogCard';
import { WorkoutEntry } from '@/components/WorkoutLogCard';

export interface RemoteProfile {
  id: string;
  username: string;
  hero_class: PlayableHeroClass;
  level: number;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  xp: number;
  xp_to_next: number;
  gold: number;
  is_sleeping: boolean;
  rebirths: number;
  allocated_stats: Attributes;
  buffs?: Attributes;
  appearance: CharacterAppearance;
  equipped: EquippedGear;
  costume: EquippedGear;
  use_costume: boolean;
  inventory: string[];
  stable: StableState;
  metrics: HeroMetrics;
  study_entries?: StudyEntry[];
  workout_entries?: WorkoutEntry[];
  party_id: string | null;
}

export interface RemoteParty {
  id: string;
  name: string;
  invite_code: string;
  leader_id: string | null;
  boss_stage?: number;
  boss_id: string;
  boss_name: string;
  boss_sprite: string;
  boss_hp: number;
  boss_max_hp: number;
  boss_attack: number;
  reward_gold: number;
  reward_xp: number;
}

export interface RemotePartyMessage {
  id: string;
  party_id: string;
  user_id: string | null;
  username: string;
  kind: 'chat' | 'system';
  content: string;
  created_at: string;
}

export async function fetchUserBundle(userId: string) {
  const supabase = createClient();

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<RemoteProfile>();

  if (pErr || !profile) return null;

  let party: RemoteParty | null = null;
  let members: RemoteProfile[] = [];
  let messages: RemotePartyMessage[] = [];

  if (profile.party_id) {
    const { data: partyData } = await supabase
      .from('parties')
      .select('*')
      .eq('id', profile.party_id)
      .maybeSingle<RemoteParty>();
    party = partyData ?? null;

    const { data: memberRows } = await supabase
      .from('profiles')
      .select('*')
      .eq('party_id', profile.party_id)
      .order('level', { ascending: false });
    members = (memberRows as RemoteProfile[]) ?? [];

    const { data: msgRows } = await supabase
      .from('party_messages')
      .select('*')
      .eq('party_id', profile.party_id)
      .order('created_at', { ascending: false })
      .limit(80);
    messages = (msgRows as RemotePartyMessage[]) ?? [];
  }

  return { profile, party, members, messages };
}

export async function syncProfileToSupabase(userId: string, patch: Partial<RemoteProfile>) {
  const supabase = createClient();
  await supabase.from('profiles').update(patch).eq('id', userId);
}

export async function joinOrCreateKtzParty(
  userId: string,
  fallbackUsername = 'Aprendiz'
): Promise<RemoteParty | null> {
  const supabase = createClient();

  let { data: ktz } = await supabase
    .from('parties')
    .select('*')
    .eq('name', 'KTZ - Know The Zero')
    .limit(1)
    .maybeSingle<RemoteParty>();

  if (!ktz) {
    const { data: created } = await supabase
      .from('parties')
      .insert({ name: 'KTZ - Know The Zero', invite_code: 'KTZ000', leader_id: userId })
      .select()
      .maybeSingle<RemoteParty>();
    ktz = created ?? null;
  }

  if (ktz) {
    // Garante que o perfil exista e esteja na KTZ
    await supabase.from('profiles').upsert(
      {
        id: userId,
        username: fallbackUsername,
        party_id: ktz.id,
      },
      { onConflict: 'id' }
    );
  }

  return ktz;
}

export async function sendRemotePartyMessage(
  partyId: string,
  userId: string | null,
  username: string,
  content: string,
  kind: 'chat' | 'system' = 'chat'
) {
  const supabase = createClient();
  await supabase.from('party_messages').insert({
    party_id: partyId,
    user_id: userId,
    username,
    kind,
    content,
  });
}

export async function updateRemotePartyBoss(
  partyId: string,
  patch: Partial<
    Pick<
      RemoteParty,
      | 'boss_stage'
      | 'boss_id'
      | 'boss_name'
      | 'boss_sprite'
      | 'boss_hp'
      | 'boss_max_hp'
      | 'boss_attack'
      | 'reward_gold'
      | 'reward_xp'
    >
  >
) {
  const supabase = createClient();
  await supabase.from('parties').update(patch).eq('id', partyId);
}

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: any;

const logoVanessa = require('./assets/logo-vanessa.jpeg');

const colors = {
  primary: '#B78AC9',       // lilas principal da identidade
  primaryDark: '#7A5B93',   // lilas escuro elegante
  secondary: '#F3CADB',     // rosa suave
  gold: '#C8A96A',          // detalhe premium/dourado
  softPink: '#FFF4F8',
  softLavender: '#F7F2FB',
  background: '#FFFBFD',
  surface: '#FFFFFF',
  text: '#2F2636',
  muted: '#8F8398',
  border: '#EEE4F1',
  success: '#32B768',
  danger: '#C94C63',
  warning: '#C8A96A',
  blueButton: '#7A5B93',
  scheduleBlue: '#F4ECFA',
  scheduleBlueText: '#5D4A68',
};

const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const horarios = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '18:30', '19:00', '19:30', '20:00',
];

const ADMIN_EMAILS = [
  'vanessarorigterapias@gmail.com',
];

const STORAGE_KEYS = {
  clientes: '@vanessa_rorig_clientes_v12',
  servicos: '@vanessa_rorig_servicos_v12',
  agendamentos: '@vanessa_rorig_agendamentos_v12',
  bloqueios: '@vanessa_rorig_bloqueios_v12',
  sessao: '@vanessa_rorig_sessao_v12',
  backup: '@vanessa_rorig_backup_v12',
};

const env = typeof process !== 'undefined' ? process.env || {} : {};

// Configure estas variaveis no Render/Expo quando possivel.
// O fallback abaixo evita tela em branco se o deploy subir sem Environment Variables.
const SUPABASE_URL =
  env.EXPO_PUBLIC_SUPABASE_URL || 'https://gyigbtketsqfjhnbpvfn.supabase.co';

const SUPABASE_ANON_KEY =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aWdidGtldHNxZmpobmJwdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzU5MTksImV4cCI6MjA5NDgxMTkxOX0.2RIb8VMFpq0gZT7jxno8_0YmtHefvKWCQyVkyY6vGVQ';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

const bancoOnlineAtivo = true;

function urlRecuperacaoSenha() {
  const globalScope: any = globalThis as any;
  const origem = globalScope?.location?.origin || 'https://agenda-vanessa-1.onrender.com';
  return `${origem}?recuperar=senha`;
}

try {
  const Notifications = require('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // No web, as notificacoes locais podem nao estar disponiveis.
}


type Perfil = 'admin' | 'cliente' | null;

type Cliente = {
  id: string;
  nome: string;
  celular: string;
  cpf: string;
  aniversario: string;
  fotoUrl?: string;
  email?: string;
  semCadastro?: boolean;
};

type Servico = {
  id: string;
  nome: string;
  preco: string;
  duracaoMinutos?: number;
};

type Agendamento = {
  id: string;
  cliente: Cliente;
  servico: Servico;
  duracaoMinutos?: number;
  dataISO: string;
  horario: string;
  observacao: string;
  encaixe: boolean;
  status: 'Agendado' | 'Cancelado';
  confirmado?: boolean;
  presente?: boolean;
  cancelamentoMotivo?: string;
};

type Bloqueio = {
  id: string;
  dataISO: string;
  horario: string;
  motivo: string;
};

const servicosIniciais: Servico[] = [
  { id: '1', nome: 'Aplicação de bandagem', preco: 'R$ 50,00', duracaoMinutos: 30 },
  { id: '2', nome: 'Drenagem + Manta térmica Black', preco: 'R$ 79,00', duracaoMinutos: 60 },
  { id: '3', nome: 'Head Spa Afrodite', preco: 'R$ 200,00', duracaoMinutos: 60 },
  { id: '4', nome: 'Head Spa Cleopatra Lux', preco: 'R$ 269,00', duracaoMinutos: 90 },
  { id: '5', nome: 'Liberação Miofacial', preco: 'R$ 160,00', duracaoMinutos: 60 },
  { id: '6', nome: 'Limpeza de pele', preco: 'R$ 160,00', duracaoMinutos: 60 },
  { id: '7', nome: 'Limpeza de Pele + Peeling', preco: 'R$ 200,00', duracaoMinutos: 90 },
];

const clientesIniciais: Cliente[] = [
  {
    id: '1',
    nome: 'Flavia Pereira Bradfich',
    celular: '(55) 99999-9999',
    cpf: '123.456.789-00',
    aniversario: '22/05',
  },
];

function toISODate(data: Date) {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatarData(data: Date) {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${data.getFullYear()}`;
}

function dataBR(iso: string) {
  return iso.split('-').reverse().join('/');
}

function aniversarioCliente(cliente: Cliente) {
  const encontrado = (cliente.aniversario || '').match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (!encontrado) return null;

  const dia = Number(encontrado[1]);
  const mes = Number(encontrado[2]);
  if (!dia || !mes || dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;

  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let data = new Date(hoje.getFullYear(), mes - 1, dia);

  if (data.getTime() < hojeSemHora.getTime()) {
    data = new Date(hoje.getFullYear() + 1, mes - 1, dia);
  }

  const dias = Math.ceil((data.getTime() - hojeSemHora.getTime()) / 86400000);
  const dataTexto = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;

  return { cliente, data, dias, dataTexto };
}

function textoDiasAniversario(dias: number) {
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanha';
  return `Em ${dias} dias`;
}

function moeda(valor: string) {
  const limpo = valor.replace(/[^0-9]/g, '');
  const numero = Number(limpo || 0) / 100;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function valorServicoNumero(preco: string) {
  const limpo = preco.replace(/[^0-9]/g, '');
  return Number(limpo || 0) / 100;
}

function duracaoServico(servico?: Servico | null) {
  return Number(servico?.duracaoMinutos || 30);
}

function duracaoAgendamento(agendamento?: Agendamento | null) {
  return Number(agendamento?.duracaoMinutos || agendamento?.servico?.duracaoMinutos || 30);
}

function minutosDoHorario(horario: string) {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

function intervaloSobrepoe(inicioA: number, fimA: number, inicioB: number, fimB: number) {
  return inicioA < fimB && inicioB < fimA;
}

function telefoneWhatsApp(celular: string) {
  const numeros = celular.replace(/\D/g, '');
  if (!numeros) return '';
  return numeros.startsWith('55') ? numeros : `55${numeros}`;
}

function clienteIdPublico(email: string, celular: string) {
  const emailLimpo = email.trim().toLowerCase();
  const telefoneLimpo = celular.replace(/\D/g, '');

  if (emailLimpo) return `cliente-email-${emailLimpo}`;
  if (telefoneLimpo) return `cliente-cel-${telefoneLimpo}`;
  return `cliente-${Date.now()}`;
}

function mensagemLembrete(agendamento: Agendamento) {
  return `Olá, ${agendamento.cliente.nome}!

Passando para confirmar sua sessão amanhã (${dataBR(agendamento.dataISO)}), às ${agendamento.horario}.

Local: Casa Beija-Flor
Rua São Borja, 391 - no prédio do correio.
(A entrada fica ao lado do correio)

Preparei tudo com carinho para te receber e proporcionar um momento de pausa, cuidado e renovação.

Qualquer dúvida ou imprevisto, estou por aqui.
Até amanhã!`;
}

function mensagemConfirmacaoAgendamento(agendamento: Agendamento) {
  return `Olá, ${agendamento.cliente.nome}! ✨

Seu atendimento foi agendado com sucesso para o dia ${dataBR(agendamento.dataISO)}, às ${agendamento.horario}. 🌿

📍 Casa Beija-Flor
Rua São Borja, 391 — no prédio do correio.
(A entrada fica ao lado do correio 🤍)

Será um prazer te receber para esse momento de cuidado, pausa e renovação ✨

Qualquer dúvida, estou por aqui 🌷`;
}

function mensagemAniversario(cliente: Cliente) {
  return `Hoje o universo celebra a sua existência 🌷
Feliz novo ciclo, ${cliente.nome}!

Desejo que você se escolha mais, se acolha mais e reconheça a própria luz todos os dias ✨

E para tornar esse mês ainda mais especial, você ganhou 15% de desconto nos seus atendimentos durante todo o mês do seu aniversário 💆🏻‍♀️💜`;
}

function formatarDinheiro(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function clienteParaBanco(cliente: Cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    celular: cliente.celular,
    cpf: cliente.cpf,
    aniversario: cliente.aniversario,
    email: cliente.email || '',
    fotourl: cliente.fotoUrl || '',
  };
}

function clienteDoBanco(item: any): Cliente {
  return {
    id: item.id,
    nome: item.nome,
    celular: item.celular,
    cpf: item.cpf,
    aniversario: item.aniversario,
    email: item.email || '',
    fotoUrl: item.fotourl || '',
  };
}

function servicoParaBanco(servico: Servico) {
  return {
    id: servico.id,
    nome: servico.nome,
    preco: servico.preco,
    duracaominutos: duracaoServico(servico),
  };
}

function servicoDoBanco(item: any): Servico {
  return {
    id: item.id || '',
    nome: item.nome || '',
    preco: item.preco || 'R$ 0,00',
    duracaoMinutos: Number(item.duracaominutos || item.duracaoMinutos || 30),
  };
}

function agendamentoParaBanco(item: Agendamento) {
  return {
    id: item.id,
    cliente: item.cliente,
    servico: item.servico,
    duracaominutos: duracaoAgendamento(item),
    dataiso: item.dataISO,
    horario: item.horario,
    observacao: item.observacao,
    encaixe: item.encaixe,
    status: item.status,
    confirmado: Boolean(item.confirmado),
    presente: Boolean(item.presente),
    cancelamento_motivo: item.cancelamentoMotivo || '',
  };
}

function agendamentoDoBanco(item: any): Agendamento {
  return {
    id: item.id,
    cliente: item.cliente,
    servico: servicoDoBanco(item.servico || {}),
    duracaoMinutos: Number(item.duracaominutos || item.duracaoMinutos || item.servico?.duracaoMinutos || 30),
    dataISO: item.dataiso,
    horario: item.horario,
    observacao: item.observacao || '',
    encaixe: Boolean(item.encaixe),
    status: item.status || 'Agendado',
    confirmado: Boolean(item.confirmado),
    presente: Boolean(item.presente),
    cancelamentoMotivo: item.cancelamento_motivo || item.cancelamentoMotivo || '',
  };
}

function bloqueioParaBanco(item: Bloqueio) {
  return {
    id: item.id,
    dataiso: item.dataISO,
    horario: item.horario,
    motivo: item.motivo,
  };
}

function bloqueioDoBanco(item: any): Bloqueio {
  return {
    id: item.id,
    dataISO: item.dataiso,
    horario: item.horario,
    motivo: item.motivo || 'Bloqueado',
  };
}

export default function App() {
  const [perfil, setPerfil] = useState<Perfil>(null);
  const [emailAdmin, setEmailAdmin] = useState('vanessarorigterapias@gmail.com');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [emailAuth, setEmailAuth] = useState('');
  const [senhaAuth, setSenhaAuth] = useState('');
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  const [mostrarSenhaClienteLogin, setMostrarSenhaClienteLogin] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarSenhaMeuCadastro, setMostrarSenhaMeuCadastro] = useState(false);
  const [novaSenhaMeuCadastro, setNovaSenhaMeuCadastro] = useState('');
  const [novaSenhaRecuperacao, setNovaSenhaRecuperacao] = useState('');
  const [confirmarSenhaRecuperacao, setConfirmarSenhaRecuperacao] = useState('');
  const [mostrarSenhaRecuperacao, setMostrarSenhaRecuperacao] = useState(false);
  const [mostrarConfirmarSenhaRecuperacao, setMostrarConfirmarSenhaRecuperacao] = useState(false);
  const [nomeLoginCliente, setNomeLoginCliente] = useState('');
  const [celularLoginCliente, setCelularLoginCliente] = useState('');
  const [modoCadastroPublico, setModoCadastroPublico] = useState(false);

  const [telaAtiva, setTelaAtiva] = useState('Agenda');
  const [modalOpcoesVisivel, setModalOpcoesVisivel] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAnoVisivel, setMesAnoVisivel] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [horarioSelecionado, setHorarioSelecionado] = useState('07:30');

  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [servicos, setServicos] = useState<Servico[]>(servicosIniciais);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [agendamentoEditandoId, setAgendamentoEditandoId] = useState<string | null>(null);

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [observacao, setObservacao] = useState('');
  const [isEncaixe, setIsEncaixe] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [preferencia, setPreferencia] = useState(false);
  const [ausente, setAusente] = useState(false);

  const [novoNomeCliente, setNovoNomeCliente] = useState('');
  const [novoCelularCliente, setNovoCelularCliente] = useState('');
  const [novoCpfCliente, setNovoCpfCliente] = useState('');
  const [novoNiverCliente, setNovoNiverCliente] = useState('');
  const [novoEmailCliente, setNovoEmailCliente] = useState('');
  const [novaFotoCliente, setNovaFotoCliente] = useState('');
  const [clienteEditandoId, setClienteEditandoId] = useState<string | null>(null);

  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');
  const [novoServicoDuracao, setNovoServicoDuracao] = useState('30');
  const [servicoEditandoId, setServicoEditandoId] = useState<string | null>(null);
  const [buscaServico, setBuscaServico] = useState('');
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [modalCancelamentoVisivel, setModalCancelamentoVisivel] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [storageCarregado, setStorageCarregado] = useState(false);
  const [backupTexto, setBackupTexto] = useState('');
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);
  const [modoSemCadastroAgendamento, setModoSemCadastroAgendamento] = useState(false);
  const [aniversarioAvisadoEm, setAniversarioAvisadoEm] = useState('');
  const [notificacoesAniversarioEm, setNotificacoesAniversarioEm] = useState('');

  const dataISOSelecionada = toISODate(dataSelecionada);

  const agendamentosDoDia = agendamentos.filter(
    (a) => a.dataISO === dataISOSelecionada && a.status !== 'Cancelado'
  );

  const bloqueiosDoDia = bloqueios.filter((b) => b.dataISO === dataISOSelecionada);

  const aniversariosOrdenados = useMemo(
    () =>
      clientes
        .map(aniversarioCliente)
        .filter((item): item is NonNullable<ReturnType<typeof aniversarioCliente>> => Boolean(item))
        .sort((a, b) => a.dias - b.dias),
    [clientes]
  );

  const aniversariosHoje = aniversariosOrdenados.filter((item) => item.dias === 0);

  const agendamentoDoClienteAtual = (agendamento: Agendamento) =>
    !!clienteSelecionado && agendamento.cliente.id === clienteSelecionado.id;

  const carregarDadosOnline = async () => {
    const { data: clientesOnline, error: erroClientes } =
      await supabase.from('clientes').select('*');

    const { data: servicosOnline, error: erroServicos } =
      await supabase.from('servicos').select('*');

    const { data: agendamentosOnline, error: erroAgendamentos } =
      await supabase.from('agendamentos').select('*');

    const { data: bloqueiosOnline, error: erroBloqueios } =
      await supabase.from('bloqueios').select('*');

    if (erroClientes || erroServicos || erroAgendamentos || erroBloqueios) {
      throw new Error(
        erroClientes?.message ||
        erroServicos?.message ||
        erroAgendamentos?.message ||
        erroBloqueios?.message ||
        'Erro ao carregar banco online'
      );
    }

    if (clientesOnline) setClientes(clientesOnline.map(clienteDoBanco));
    if (servicosOnline?.length) setServicos(servicosOnline.map(servicoDoBanco));
    if (agendamentosOnline) setAgendamentos(agendamentosOnline.map(agendamentoDoBanco));
    if (bloqueiosOnline) setBloqueios(bloqueiosOnline.map(bloqueioDoBanco));
  };


  useEffect(() => {
    const carregar = async () => {
      try {
        const [c, s, a, b, sessao] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.clientes),
          AsyncStorage.getItem(STORAGE_KEYS.servicos),
          AsyncStorage.getItem(STORAGE_KEYS.agendamentos),
          AsyncStorage.getItem(STORAGE_KEYS.bloqueios),
          AsyncStorage.getItem(STORAGE_KEYS.sessao),
        ]);

        if (c) setClientes(JSON.parse(c));
        if (s) setServicos(JSON.parse(s));
        if (a) setAgendamentos(JSON.parse(a));
        if (b) setBloqueios(JSON.parse(b));

        if (sessao) {
          const p = JSON.parse(sessao);
          if (p.perfil === 'admin') {
            const { data } = await supabase.auth.getUser();
            const emailLogado = data.user?.email?.toLowerCase();
            const adminAutorizado =
              !!emailLogado &&
              ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(emailLogado);

            if (adminAutorizado) {
              setPerfil('admin');
              await carregarDadosOnline();
            } else {
              await AsyncStorage.removeItem(STORAGE_KEYS.sessao);
            }
          } else {
            setPerfil(p.perfil);
            if (p.cliente) setClienteSelecionado(p.cliente);
          }
        }
      } catch {
        Alert.alert('Atenção', 'Não consegui carregar os dados salvos neste aparelho.');
      } finally {
        setStorageCarregado(true);
      }
    };

    carregar();
  }, []);

  useEffect(() => {
    if (storageCarregado) AsyncStorage.setItem(STORAGE_KEYS.clientes, JSON.stringify(clientes));
  }, [clientes, storageCarregado]);

  useEffect(() => {
    if (storageCarregado) AsyncStorage.setItem(STORAGE_KEYS.servicos, JSON.stringify(servicos));
  }, [servicos, storageCarregado]);

  useEffect(() => {
    if (storageCarregado) AsyncStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(agendamentos));
  }, [agendamentos, storageCarregado]);

  useEffect(() => {
    if (storageCarregado) AsyncStorage.setItem(STORAGE_KEYS.bloqueios, JSON.stringify(bloqueios));
  }, [bloqueios, storageCarregado]);

  useEffect(() => {
    const globalScope: any = globalThis as any;
    const busca = globalScope?.location?.search || '';
    const hash = globalScope?.location?.hash || '';

    if (Platform.OS === 'web' && (busca.includes('recuperar=senha') || hash.includes('type=recovery'))) {
      setTelaAtiva('AtualizarSenha');
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPerfil(null);
        setTelaAtiva('AtualizarSenha');
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!bancoOnlineAtivo || !perfil) return;

    const canal = supabase
      .channel('agenda-tempo-real')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, carregarDadosOnline)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, carregarDadosOnline)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, carregarDadosOnline)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bloqueios' }, carregarDadosOnline)
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [bancoOnlineAtivo, perfil]);

  useEffect(() => {
    if (perfil !== 'admin' || aniversariosHoje.length === 0) return;

    const hoje = toISODate(new Date());
    if (aniversarioAvisadoEm === hoje) return;

    const nomes = aniversariosHoje.map((item) => item.cliente.nome).join(', ');
    Alert.alert(
      'Aniversario hoje',
      `Hoje e aniversario de: ${nomes}. Voce pode enviar a mensagem pelo menu Aniversarios.`
    );
    setAniversarioAvisadoEm(hoje);
  }, [perfil, aniversariosHoje, aniversarioAvisadoEm]);

  useEffect(() => {
    if (perfil !== 'admin' || !storageCarregado || aniversariosOrdenados.length === 0) return;

    const hoje = toISODate(new Date());
    if (notificacoesAniversarioEm === hoje) return;

    setNotificacoesAniversarioEm(hoje);
    configurarNotificacoesAniversario();
  }, [perfil, storageCarregado, aniversariosOrdenados, notificacoesAniversarioEm]);


  const diasCalendario = useMemo(() => {
    const ano = mesAnoVisivel.getFullYear();
    const mes = mesAnoVisivel.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const lista: Array<{ dia: number | null; data?: Date }> = [];

    for (let i = 0; i < primeiroDiaSemana; i += 1) lista.push({ dia: null });

    for (let dia = 1; dia <= totalDias; dia += 1) {
      lista.push({ dia, data: new Date(ano, mes, dia) });
    }

    while (lista.length % 7 !== 0) lista.push({ dia: null });

    return lista;
  }, [mesAnoVisivel]);

  const diasSemanaVisivel = useMemo(() => {
    const inicio = new Date(dataSelecionada);
    inicio.setDate(dataSelecionada.getDate() - dataSelecionada.getDay());

    return Array.from({ length: 7 }, (_, idx) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + idx);
      return data;
    });
  }, [dataSelecionada]);

  const tituloTela = () => {
    const titulos: Record<string, string> = {
      Agenda: 'Agenda',
      NovoAgendamento: 'Novo agendamento',
      NovoCadastro: clienteEditandoId ? 'Editar cliente' : 'Cadastro do cliente',
      Servicos: 'Serviços',
      Clientes: 'Clientes',
      NovoServico: servicoEditandoId ? 'Editar serviço' : 'Novo serviço',
      Comanda: 'Comanda',
      BloquearHorarios: 'Bloquear horário',
      Menu: 'Menu',
      Comandas: perfil === 'admin' ? 'Comandas' : 'Meus agendamentos',
      Configuracoes: 'Configurações',
      Bloqueios: 'Bloqueios',
      MeuCadastro: 'Meu cadastro',
      Aniversarios: 'Aniversarios',
      Financeiro: 'Financeiro',
      Backup: 'Backup',
      RecuperarSenha: 'Recuperar acesso',
      AtualizarSenha: 'Nova senha',
    };

    return titulos[telaAtiva] || telaAtiva;
  };

  const mudarMes = (direcao: number) => {
    const novoMes = new Date(
      mesAnoVisivel.getFullYear(),
      mesAnoVisivel.getMonth() + direcao,
      1
    );

    setMesAnoVisivel(novoMes);
    setDataSelecionada(novoMes);
  };

  const mudarSemana = (direcao: number) => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(dataSelecionada.getDate() + direcao * 7);
    setDataSelecionada(novaData);
    setMesAnoVisivel(new Date(novaData.getFullYear(), novaData.getMonth(), 1));
  };

  const mudarDataAgendamento = (dias: number) => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(dataSelecionada.getDate() + dias);
    setDataSelecionada(novaData);
    setMesAnoVisivel(new Date(novaData.getFullYear(), novaData.getMonth(), 1));
  };

  const selecionarHojeAgendamento = () => {
    const hoje = new Date();
    setDataSelecionada(hoje);
    setMesAnoVisivel(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  };


  const entrarComEmail = async () => {
    if (acaoEmAndamento) return;

    if (!emailAuth.trim() || !senhaAuth.trim()) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAuth.trim().toLowerCase(),
        password: senhaAuth.trim(),
      });

      if (error) {
        Alert.alert('Erro no login', error.message);
        return;
      }

      const email = (data.user?.email || emailAuth.trim()).toLowerCase();
      const { data: clienteOnline } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      const clienteExistente =
        (clienteOnline ? clienteDoBanco(clienteOnline) : null) ||
        clientes.find((c) => c.email?.toLowerCase() === email);

      if (clienteExistente) {
        await finalizarEntradaCliente(clienteExistente);
        return;
      }

      Alert.alert(
        'Cadastro nao encontrado',
        'O login entrou, mas nao encontrei seu cadastro de cliente. Toque em "Sou novo aqui" para cadastrar.'
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const entrarComEmailSeguro = async () => {
    if (acaoEmAndamento) return;

    const email = emailAuth.trim().toLowerCase();
    const senha = senhaAuth.trim();

    if (!email) {
      Alert.alert('Atencao', 'Informe seu e-mail.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      if (senha) {
        await supabase.auth.signInWithPassword({ email, password: senha });
      }

      const { data: clienteOnline, error: erroCliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (erroCliente) {
        Alert.alert('Erro no login', erroCliente.message);
        return;
      }

      const clienteExistente =
        (clienteOnline ? clienteDoBanco(clienteOnline) : null) ||
        clientes.find((c) => c.email?.toLowerCase() === email);

      if (!clienteExistente) {
        Alert.alert(
          'Cadastro nao encontrado',
          'Nao encontrei seu cadastro de cliente. Toque em "Sou novo aqui" para cadastrar.'
        );
        return;
      }

      await finalizarEntradaCliente(clienteExistente);
      setEmailAuth('');
      setSenhaAuth('');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const criarContaComEmail = async () => {
    if (acaoEmAndamento) return;

    if (!novoNomeCliente.trim()) {
      Alert.alert('Atenção', 'Preencha seu nome.');
      return;
    }

    if (!novoEmailCliente.trim() || !senhaAuth.trim()) {
      Alert.alert('Atenção', 'Informe e-mail e senha para criar sua conta.');
      return;
    }

    if (senhaAuth.trim().length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: novoEmailCliente.trim().toLowerCase(),
        password: senhaAuth.trim(),
      });

      if (error && !error.message.toLowerCase().includes('already')) {
        Alert.alert(
          'Login ainda nao criado',
          'Vou salvar seu cadastro mesmo assim. Depois voce pode entrar pelo nome/celular ou recuperar acesso pelo e-mail.'
        );
      }

      await cadastrarClientePublico(false);
      if (false) {
        Alert.alert(
          'Cadastro salvo',
          'Seu cadastro foi salvo. Se chegar um e-mail de confirmação, confirme depois para usar login e senha.'
        );
      }
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const recuperarSenha = async (emailInformado?: string) => {
    if (acaoEmAndamento) return;

    const email = (emailInformado || emailAuth).trim().toLowerCase();

    if (!email) {
      Alert.alert('Atenção', 'Digite seu e-mail para recuperar a senha.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: urlRecuperacaoSenha(),
      });

      if (error) {
        Alert.alert('Erro ao recuperar senha', error.message);
        return;
      }

      Alert.alert('Pronto', 'Enviamos um e-mail de recuperação de senha.');
    } catch {
      Alert.alert('Erro', 'Nao consegui enviar o e-mail de recuperação agora.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const entrarAdmin = async () => {
    if (acaoEmAndamento) return;

    const email = emailAdmin.trim().toLowerCase();

    if (!email || !senhaAdmin.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha da Vanessa.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senhaAdmin.trim(),
      });

      if (error) {
        Alert.alert('Erro no login da Vanessa', error.message);
        return;
      }

      const emailLogado = data.user?.email?.toLowerCase() || email;
      const adminAutorizado = ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(emailLogado);

      if (!adminAutorizado) {
        await supabase.auth.signOut();
        Alert.alert('Acesso bloqueado', 'Esse e-mail não está liberado como admin da agenda.');
        return;
      }

      setPerfil('admin');
      setEmailAdmin('');
      setSenhaAdmin('');
      await carregarDadosOnline();
      await AsyncStorage.setItem(STORAGE_KEYS.sessao, JSON.stringify({ perfil: 'admin', email: emailLogado }));
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const entrarCliente = async () => {
    if (!nomeLoginCliente.trim()) {
      Alert.alert('Atenção', 'Digite seu nome para continuar.');
      return;
    }

    let cliente =
      clientes.find((c) => c.celular === celularLoginCliente && celularLoginCliente.trim()) ||
      clientes.find((c) => c.nome.toLowerCase() === nomeLoginCliente.trim().toLowerCase());

    if (!cliente) {
      cliente = {
        id: clienteIdPublico('', celularLoginCliente),
        nome: nomeLoginCliente.trim(),
        celular: celularLoginCliente || 'Não cadastrado',
        cpf: 'Não cadastrado',
        aniversario: 'Não cadastrado',
      };
      setClientes((lista) => [cliente as Cliente, ...lista]);
    }

    setClienteSelecionado(cliente);
    setPerfil('cliente');
    setTelaAtiva('Agenda');
    setNomeLoginCliente('');
    setCelularLoginCliente('');

    await AsyncStorage.setItem(
      STORAGE_KEYS.sessao,
      JSON.stringify({ perfil: 'cliente', cliente })
    );
  };

  const entrarVisitante = async () => {
    limparFormCliente();
    setClienteSelecionado(null);
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEYS.sessao);
    setPerfil('cliente');
    setTelaAtiva('Agenda');
    setModoCadastroPublico(false);

    try {
      await carregarDadosOnline();
    } catch {
      // Se o banco online estiver sem permissao publica, a agenda ainda abre com os dados locais.
    }
  };

  const finalizarEntradaCliente = async (cliente: Cliente) => {
    setClientes((lista) => {
      const existe = lista.some((c) => c.id === cliente.id);
      return existe
        ? lista.map((c) => (c.id === cliente.id ? cliente : c))
        : [cliente, ...lista];
    });

    setClienteSelecionado(cliente);
    setPerfil('cliente');
    setTelaAtiva('Agenda');
    setModoCadastroPublico(false);
    setModoSemCadastroAgendamento(false);
    setAgendamentoEditandoId(null);

    await AsyncStorage.setItem(
      STORAGE_KEYS.sessao,
      JSON.stringify({ perfil: 'cliente', cliente })
    );
  };

  const criarCadastroClienteNovo = async () => {
    if (acaoEmAndamento) return;

    const nome = novoNomeCliente.trim();
    const celular = novoCelularCliente.trim();
    const email = novoEmailCliente.trim().toLowerCase();
    const senha = senhaAuth.trim();

    if (!nome) {
      Alert.alert('Atencao', 'Preencha seu nome completo.');
      return;
    }

    if (!celular) {
      Alert.alert('Atencao', 'Preencha seu celular.');
      return;
    }

    if (!email) {
      Alert.alert('Atencao', 'Preencha seu e-mail.');
      return;
    }

    if (!senha || senha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      await supabase.auth.signOut();

      const novoCliente: Cliente = {
        id: clienteIdPublico(email, celular),
        nome,
        celular,
        cpf: novoCpfCliente || 'Nao cadastrado',
        aniversario: novoNiverCliente || 'Nao cadastrado',
        email,
        fotoUrl: novaFotoCliente || '',
      };

      const { error: erroCliente } = await supabase
        .from('clientes')
        .insert(clienteParaBanco(novoCliente));

      if (erroCliente) {
        const mensagem = erroCliente.message.toLowerCase();

        if (mensagem.includes('duplicate') || mensagem.includes('already') || mensagem.includes('unique')) {
          await finalizarEntradaCliente(novoCliente);
          setSenhaAuth('');
          limparFormCliente();
          Alert.alert('Cadastro encontrado', 'Esse cadastro ja existia. Abrimos a agenda para escolher horario.');
          return;
        }

        Alert.alert(
          'Cadastro nao salvo',
          `Nao consegui salvar no banco: ${erroCliente.message}`
        );
        return;
      }

      await finalizarEntradaCliente(novoCliente);

      const { error: erroAuth } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      setSenhaAuth('');
      limparFormCliente();

      if (erroAuth) {
        Alert.alert(
          'Cadastro salvo',
          'Cliente salvo e agenda liberada. Se o acesso por senha nao entrar depois, use recuperar senha.'
        );
        return;
      }

      Alert.alert('Pronto', 'Cadastro salvo. Agora escolha uma data e um horario.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const criarCadastroClienteNovoSeguro = async () => {
    if (acaoEmAndamento) return;

    const nome = novoNomeCliente.trim();
    const celular = novoCelularCliente.trim();
    const email = novoEmailCliente.trim().toLowerCase();
    const senha = senhaAuth.trim();
    const cliente: Cliente = {
      id: clienteIdPublico(email, celular),
      nome,
      celular,
      cpf: novoCpfCliente || 'Nao cadastrado',
      aniversario: novoNiverCliente || 'Nao cadastrado',
      email,
      fotoUrl: novaFotoCliente || '',
    };

    if (!nome) {
      Alert.alert('Atencao', 'Preencha seu nome completo.');
      return;
    }

    if (!celular) {
      Alert.alert('Atencao', 'Preencha seu celular.');
      return;
    }

    if (!email) {
      Alert.alert('Atencao', 'Preencha seu e-mail.');
      return;
    }

    if (!senha || senha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      await supabase.auth.signOut();

      const { error: erroAuth } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (erroAuth) {
        const msg = erroAuth.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          await supabase.auth.signInWithPassword({ email, password: senha });
        }
      }

      const { data: existentePorEmail } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existentePorEmail) {
        const clienteExistente = clienteDoBanco(existentePorEmail);
        await finalizarEntradaCliente(clienteExistente);
        setSenhaAuth('');
        limparFormCliente();
        Alert.alert('Cadastro encontrado', 'Abrimos a agenda para voce escolher horario.');
        return;
      }

      const { error: erroCliente } = await supabase
        .from('clientes')
        .insert(clienteParaBanco(cliente));

      if (erroCliente) {
        const mensagem = erroCliente.message.toLowerCase();

        if (mensagem.includes('duplicate') || mensagem.includes('already') || mensagem.includes('unique')) {
          await finalizarEntradaCliente(cliente);
          setSenhaAuth('');
          limparFormCliente();
          Alert.alert('Cadastro encontrado', 'Abrimos a agenda para voce escolher horario.');
          return;
        }

        Alert.alert(
          'Cadastro nao salvo',
          `Nao consegui salvar no banco de dados: ${erroCliente.message}`
        );
        return;
      }

      await finalizarEntradaCliente(cliente);
      setSenhaAuth('');
      limparFormCliente();
      Alert.alert('Pronto', 'Cadastro salvo no banco. Agora escolha uma data e um horario.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const cadastrarClientePublico = async (controlarCarregamento = true) => {
    if (acaoEmAndamento && controlarCarregamento) return;

    if (!novoNomeCliente.trim()) {
      Alert.alert('Atenção', 'Preencha seu nome completo.');
      return;
    }

    if (!novoCelularCliente.trim()) {
      Alert.alert('Atenção', 'Preencha seu celular.');
      return;
    }

    if (controlarCarregamento) setAcaoEmAndamento(true);

    try {
      const novoCliente: Cliente = {
        id: clienteIdPublico(novoEmailCliente, novoCelularCliente),
        nome: novoNomeCliente.trim(),
        celular: novoCelularCliente.trim(),
        cpf: novoCpfCliente || 'Não cadastrado',
        aniversario: novoNiverCliente || 'Não cadastrado',
        email: novoEmailCliente.trim().toLowerCase() || '',
        fotoUrl: novaFotoCliente || '',
      };

      const { error } = await supabase
        .from('clientes')
        .upsert(clienteParaBanco(novoCliente));

      if (error) {
        Alert.alert(
          'Cadastro não salvo',
          'Não consegui salvar seu cadastro no banco online. Verifique a internet e as regras do Supabase.'
        );
        return;
      }

      setClientes((lista) => {
        const existe = lista.some((c) => c.id === novoCliente.id);
        return existe
          ? lista.map((c) => (c.id === novoCliente.id ? novoCliente : c))
          : [novoCliente, ...lista];
      });
      setClienteSelecionado(novoCliente);
      setPerfil('cliente');
      setTelaAtiva('Agenda');
      setModoCadastroPublico(false);
      setModoSemCadastroAgendamento(false);
      setAgendamentoEditandoId(null);

      setSenhaAuth('');
      limparFormCliente();

      await AsyncStorage.setItem(
        STORAGE_KEYS.sessao,
        JSON.stringify({ perfil: 'cliente', cliente: novoCliente })
      );

      Alert.alert('Pronto', 'Cadastro salvo no banco. Agora escolha uma data e um horário.');
    } finally {
      if (controlarCarregamento) setAcaoEmAndamento(false);
    }
  };

  const sair = async () => {
    setPerfil(null);
    setTelaAtiva('Agenda');
    setClienteSelecionado(null);
    setServicoSelecionado(null);
    setAgendamentoSelecionado(null);
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEYS.sessao);
  };

  const limparFormCliente = () => {
    setNovoNomeCliente('');
    setNovoCelularCliente('');
    setNovoCpfCliente('');
    setNovoNiverCliente('');
    setNovoEmailCliente('');
    setNovaFotoCliente('');
    setClienteEditandoId(null);
  };

  const abrirNovoCliente = () => {
    limparFormCliente();
    setTelaAtiva('NovoCadastro');
  };

  const editarCliente = (item: Cliente) => {
    setClienteEditandoId(item.id);
    setNovoNomeCliente(item.nome);
    setNovoCelularCliente(item.celular === 'Não cadastrado' ? '' : item.celular);
    setNovoCpfCliente(item.cpf === 'Não cadastrado' ? '' : item.cpf);
    setNovoNiverCliente(item.aniversario === 'Não cadastrado' ? '' : item.aniversario);
    setNovoEmailCliente(item.email || '');
    setNovaFotoCliente(item.fotoUrl || '');
    setTelaAtiva('NovoCadastro');
  };

  const salvarCliente = async () => {
    if (acaoEmAndamento) return;

    if (!novoNomeCliente.trim()) {
      Alert.alert('Atenção', 'Preencha o nome do cliente.');
      return;
    }

    const cliente: Cliente = {
      id: clienteEditandoId || Date.now().toString(),
      nome: novoNomeCliente.trim(),
      celular: novoCelularCliente || 'Não cadastrado',
      cpf: novoCpfCliente || 'Não cadastrado',
      aniversario: novoNiverCliente || 'Não cadastrado',
      email: novoEmailCliente.trim().toLowerCase() || '',
      fotoUrl: novaFotoCliente || '',
    };

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase
        .from('clientes')
        .upsert(clienteParaBanco(cliente));

      if (error) {
        Alert.alert('Erro ao salvar cliente', error.message);
        return;
      }

      if (clienteEditandoId) {
        setClientes((lista) => lista.map((c) => (c.id === clienteEditandoId ? cliente : c)));
        setAgendamentos((lista) =>
          lista.map((a) => (a.cliente.id === clienteEditandoId ? { ...a, cliente } : a))
        );

        if (clienteSelecionado?.id === clienteEditandoId) setClienteSelecionado(cliente);

        Alert.alert('Pronto', 'Cliente atualizado no banco.');
        limparFormCliente();
        setTelaAtiva(perfil === 'admin' ? 'Clientes' : 'Agenda');
        return;
      }

      setClientes((lista) => [cliente, ...lista]);
      setClienteSelecionado(cliente);
      Alert.alert('Pronto', 'Cliente cadastrado no banco.');
      limparFormCliente();
      setTelaAtiva('Agenda');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const excluirCliente = async (id: string) => {
    if (acaoEmAndamento) return;

    setAcaoEmAndamento(true);

    try {
      const { error: erroAgendamentos } = await supabase
        .from('agendamentos')
        .delete()
        .eq('cliente->>id', id);

      if (erroAgendamentos) {
        Alert.alert('Erro ao excluir agendamentos', erroAgendamentos.message);
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        Alert.alert('Erro ao excluir cliente', error.message);
        return;
      }

      setClientes((lista) => lista.filter((c) => c.id !== id));
      setAgendamentos((lista) => lista.filter((a) => a.cliente.id !== id));
      if (clienteSelecionado?.id === id) setClienteSelecionado(null);
      await carregarDadosOnline();
      setTelaAtiva('Clientes');
      Alert.alert('Pronto', 'Cliente excluído e alterações salvas.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const limparFormServico = () => {
    setNovoServicoNome('');
    setNovoServicoPreco('');
    setNovoServicoDuracao('30');
    setServicoEditandoId(null);
  };

  const abrirNovoServico = () => {
    limparFormServico();
    setTelaAtiva('NovoServico');
  };

  const editarServico = (item: Servico) => {
    setServicoEditandoId(item.id);
    setNovoServicoNome(item.nome);
    setNovoServicoPreco(item.preco.replace(/[^0-9]/g, ''));
    setNovoServicoDuracao(String(duracaoServico(item)));
    setTelaAtiva('NovoServico');
  };

  const salvarServico = () => {
    if (!novoServicoNome.trim()) {
      Alert.alert('Atenção', 'Preencha o nome do serviço.');
      return;
    }

    const servico: Servico = {
      id: servicoEditandoId || Date.now().toString(),
      nome: novoServicoNome.trim(),
      preco: moeda(novoServicoPreco || '0'),
      duracaoMinutos: Number(novoServicoDuracao || 30),
    };

    supabase
      .from('servicos')
      .upsert(servicoParaBanco(servico))
      .then(({ error }) => {
        if (error) Alert.alert('Erro Supabase serviços', error.message);
      });

    if (servicoEditandoId) {
      setServicos((lista) => lista.map((s) => (s.id === servicoEditandoId ? servico : s)));
      setAgendamentos((lista) =>
        lista.map((a) => (a.servico.id === servicoEditandoId ? { ...a, servico } : a))
      );

      if (servicoSelecionado?.id === servicoEditandoId) setServicoSelecionado(servico);
      Alert.alert('Pronto', 'Serviço atualizado.');
    } else {
      setServicos((lista) => [servico, ...lista]);
      setServicoSelecionado(servico);
      Alert.alert('Pronto', 'Serviço cadastrado.');
    }

    limparFormServico();
    setTelaAtiva('Servicos');
  };

  const excluirServico = async (id: string) => {
    if (acaoEmAndamento) return;

    const possuiAgendamento = agendamentos.some(
      (a) => a.servico.id === id && a.status !== 'Cancelado'
    );

    if (possuiAgendamento) {
      Alert.alert(
        'Servico em uso',
        'Esse servico tem agendamentos ativos. Cancele ou reagende esses horarios antes de excluir.'
      );
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) {
        Alert.alert('Erro ao excluir servico', error.message);
        return;
      }

      setServicos((lista) => lista.filter((s) => s.id !== id));
      if (servicoSelecionado?.id === id) setServicoSelecionado(null);
      limparFormServico();
      await carregarDadosOnline();
      setTelaAtiva('Servicos');
      Alert.alert('Pronto', 'Servico excluido do banco.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const agendamentoNoIntervalo = (
    dataISO: string,
    hora: string,
    duracaoMinutos = 30,
    ignorarAgendamentoId?: string | null
  ) => {
    const inicio = minutosDoHorario(hora);
    const fim = inicio + duracaoMinutos;

    return agendamentos.find((a) => {
      if (a.dataISO !== dataISO || a.status === 'Cancelado') return false;
      if (ignorarAgendamentoId && a.id === ignorarAgendamentoId) return false;
      const inicioAgendado = minutosDoHorario(a.horario);
      const fimAgendado = inicioAgendado + duracaoAgendamento(a);
      return intervaloSobrepoe(inicio, fim, inicioAgendado, fimAgendado);
    });
  };

  const horarioOcupado = (
    dataISO: string,
    hora: string,
    duracaoMinutos = 30,
    ignorarAgendamentoId?: string | null
  ) => Boolean(agendamentoNoIntervalo(dataISO, hora, duracaoMinutos, ignorarAgendamentoId));

  const horarioBloqueado = (dataISO: string, hora: string, duracaoMinutos = 30) => {
    const inicio = minutosDoHorario(hora);
    const fim = inicio + duracaoMinutos;

    return bloqueios.some((b) => {
      if (b.dataISO !== dataISO) return false;
      const inicioBloqueio = minutosDoHorario(b.horario);
      return intervaloSobrepoe(inicio, fim, inicioBloqueio, inicioBloqueio + 30);
    });
  };

  const solicitarPermissaoNotificacoes = async () => {
    if (Platform.OS === 'web') return false;

    try {
      const Notifications = require('expo-notifications');
      const atual = await Notifications.getPermissionsAsync();
      let status = atual.status;

      if (status !== 'granted') {
        const pedido = await Notifications.requestPermissionsAsync();
        status = pedido.status;
      }

      return status === 'granted';
    } catch {
      return false;
    }
  };

  const configurarNotificacoesAniversario = async () => {
    if (Platform.OS === 'web') return;

    const permitido = await solicitarPermissaoNotificacoes();
    if (!permitido) return;

    try {
      const Notifications = require('expo-notifications');
      const agendadas = await Notifications.getAllScheduledNotificationsAsync();

      await Promise.all(
        agendadas
          .filter((item: any) => item.content?.data?.tipo === 'aniversario-cliente')
          .map((item: any) => Notifications.cancelScheduledNotificationAsync(item.identifier))
      );

      const agora = new Date();
      const proximos = aniversariosOrdenados.slice(0, 40);

      await Promise.all(
        proximos.map(async (item) => {
          const dataNotificacao = new Date(item.data);
          dataNotificacao.setHours(9, 0, 0, 0);

          if (dataNotificacao.getTime() <= agora.getTime()) {
            dataNotificacao.setTime(agora.getTime() + 5000);
          }

          const content = {
              title: `Aniversario de ${item.cliente.nome}`,
              body: 'Hoje e aniversario dessa cliente. Abra o app para enviar a mensagem pelo WhatsApp.',
              data: {
                tipo: 'aniversario-cliente',
                clienteId: item.cliente.id,
              },
            };

          try {
            return await Notifications.scheduleNotificationAsync({
              content,
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
                date: dataNotificacao,
              },
            });
          } catch {
            return Notifications.scheduleNotificationAsync({
              content,
              trigger: dataNotificacao,
            });
          }
        })
      );
    } catch {
      // Notificacoes locais dependem do app instalado e da permissao do aparelho.
    }
  };

  const enviarNotificacaoLocal = async (titulo: string, corpo: string) => {
    if (Platform.OS === 'web') return;

    try {
      const Notifications = require('expo-notifications');
      const permitido = await solicitarPermissaoNotificacoes();
      if (!permitido) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: corpo,
        },
        trigger: null,
      });
    } catch {
      // Se expo-notifications não estiver instalado, o app ignora sem quebrar.
    }
  };

  const salvarAgendamento = async () => {
    if (acaoEmAndamento) return;

    let clienteAgendamento = modoSemCadastroAgendamento ? null : clienteSelecionado;
    const semCadastro = modoSemCadastroAgendamento || !clienteAgendamento;

    if (!clienteAgendamento || modoSemCadastroAgendamento) {
      if (!novoNomeCliente.trim()) {
        Alert.alert('Atenção', 'Informe um nome ou observação para identificar o agendamento.');
        return;
      }

      clienteAgendamento = {
        id: `sem-cadastro-${Date.now()}`,
        nome: novoNomeCliente.trim(),
        celular: novoCelularCliente.trim() || 'Sem cadastro',
        cpf: novoCpfCliente || 'Não cadastrado',
        aniversario: novoNiverCliente || 'Não cadastrado',
        email: novoEmailCliente.trim().toLowerCase() || '',
        fotoUrl: novaFotoCliente || '',
        semCadastro: true,
      };
    }

    if (!clienteAgendamento) {
      Alert.alert('Atenção', 'Selecione ou informe um cliente.');
      return;
    }

    if (!servicoSelecionado) {
      Alert.alert('Atenção', 'Selecione um serviço.');
      return;
    }

    const duracaoSelecionada = duracaoServico(servicoSelecionado);

    if (horarioBloqueado(dataISOSelecionada, horarioSelecionado, duracaoSelecionada)) {
      Alert.alert('Horário bloqueado', 'Esse horário foi bloqueado pela Vanessa.');
      return;
    }

    if (horarioOcupado(dataISOSelecionada, horarioSelecionado, duracaoSelecionada, agendamentoEditandoId)) {
      Alert.alert('Horário ocupado', `Esse serviço precisa de ${duracaoSelecionada} minutos e encosta em outro agendamento.`);
      return;
    }

    const idAgendamento = agendamentoEditandoId || Date.now().toString();
    const novo: Agendamento = {
      id: idAgendamento,
      cliente: clienteAgendamento,
      servico: { ...servicoSelecionado, duracaoMinutos: duracaoSelecionada },
      duracaoMinutos: duracaoSelecionada,
      dataISO: dataISOSelecionada,
      horario: horarioSelecionado,
      observacao,
      encaixe: isEncaixe,
      status: 'Agendado',
      confirmado: agendamentoSelecionado?.id === idAgendamento ? agendamentoSelecionado.confirmado : false,
      presente: agendamentoSelecionado?.id === idAgendamento ? agendamentoSelecionado.presente : false,
    };

    setAcaoEmAndamento(true);

    try {
      const { data: agendamentosOnline, error: erroAgendaOnline } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('dataiso', dataISOSelecionada);

      const { data: bloqueiosOnline, error: erroBloqueiosOnline } = await supabase
        .from('bloqueios')
        .select('*')
        .eq('dataiso', dataISOSelecionada);

      if (erroAgendaOnline || erroBloqueiosOnline) {
        Alert.alert(
          'Nao consegui conferir a agenda',
          erroAgendaOnline?.message || erroBloqueiosOnline?.message || 'Tente novamente.'
        );
        return;
      }

      const inicioNovo = minutosDoHorario(horarioSelecionado);
      const fimNovo = inicioNovo + duracaoSelecionada;
      const conflitoOnline = (agendamentosOnline || []).map(agendamentoDoBanco).some((a) => {
        if (a.status === 'Cancelado') return false;
        if (agendamentoEditandoId && a.id === agendamentoEditandoId) return false;
        const inicioExistente = minutosDoHorario(a.horario);
        return intervaloSobrepoe(inicioNovo, fimNovo, inicioExistente, inicioExistente + duracaoAgendamento(a));
      });
      const bloqueioOnline = (bloqueiosOnline || []).map(bloqueioDoBanco).some((b) => {
        const inicioBloqueio = minutosDoHorario(b.horario);
        return intervaloSobrepoe(inicioNovo, fimNovo, inicioBloqueio, inicioBloqueio + 30);
      });

      if (conflitoOnline || bloqueioOnline) {
        Alert.alert('Horario indisponivel', 'Escolha outro horario. Esse horario ja esta reservado ou bloqueado.');
        await carregarDadosOnline();
        return;
      }

      if (perfil !== 'admin') {
        await supabase.auth.signOut();
      }

      if (!semCadastro && perfil === 'admin') {
        const { error: erroCliente } = await supabase
          .from('clientes')
          .upsert(clienteParaBanco(clienteAgendamento));

        if (erroCliente) {
          Alert.alert('Não consegui salvar o cliente', erroCliente.message);
          return;
        }
      }

      const comando = agendamentoEditandoId
        ? supabase.from('agendamentos').update(agendamentoParaBanco(novo)).eq('id', agendamentoEditandoId)
        : supabase.from('agendamentos').insert(agendamentoParaBanco(novo));

      const { error } = await comando;

      if (error) {
        if (error.message.toLowerCase().includes('duplicate') || error.code === '23505') {
          Alert.alert('Horario ocupado', 'Esse horario acabou de ser reservado. Escolha outro horario.');
          await carregarDadosOnline();
          return;
        }

        Alert.alert('Não consegui salvar o agendamento', error.message);
        return;
      }

      setAgendamentos((lista) =>
        agendamentoEditandoId
          ? lista.map((a) => (a.id === agendamentoEditandoId ? novo : a))
          : [novo, ...lista]
      );
      if (!semCadastro) {
        setClientes((lista) => {
          const existe = lista.some((c) => c.id === clienteAgendamento?.id);
          return existe
            ? lista.map((c) => (c.id === clienteAgendamento?.id ? clienteAgendamento as Cliente : c))
            : [clienteAgendamento as Cliente, ...lista];
        });
        setClienteSelecionado(clienteAgendamento);
      }

      if (perfil === 'admin') setClienteSelecionado(null);

      setServicoSelecionado(null);
      setObservacao('');
      setIsEncaixe(false);
      setAgendamentoEditandoId(null);
      setAgendamentoSelecionado(null);
      setModoSemCadastroAgendamento(false);
      limparFormCliente();
      await carregarDadosOnline();
      setTelaAtiva('Agenda');
      enviarNotificacaoLocal('Agendamento salvo', `${novo.servico.nome} em ${dataBR(novo.dataISO)} às ${novo.horario}`);
      gerarBackupAutomatico();
      Alert.alert('Pronto', agendamentoEditandoId ? 'Agendamento atualizado no banco.' : 'Agendamento salvo no banco.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const alternarConfirmacaoAgendamento = (campo: 'confirmado' | 'presente', valor: boolean) => {
    if (!agendamentoSelecionado) return;

    const atualizado = { ...agendamentoSelecionado, [campo]: valor };
    setAgendamentoSelecionado(atualizado);
    setAgendamentos((lista) =>
      lista.map((a) => (a.id === atualizado.id ? atualizado : a))
    );

    supabase
      .from('agendamentos')
      .update({
        confirmado: Boolean(atualizado.confirmado),
        presente: Boolean(atualizado.presente),
      })
      .eq('id', atualizado.id);
  };

  const editarAgendamento = () => {
    if (!agendamentoSelecionado) return;

    const a = agendamentoSelecionado;
    const dataBase = new Date(`${a.dataISO}T12:00:00`);
    setAgendamentoEditandoId(a.id);
    setDataSelecionada(dataBase);
    setMesAnoVisivel(new Date(dataBase.getFullYear(), dataBase.getMonth(), 1));
    setHorarioSelecionado(a.horario);
    setClienteSelecionado(a.cliente.semCadastro ? null : a.cliente);
    setServicoSelecionado(a.servico);
    setObservacao(a.observacao || '');
    setIsEncaixe(Boolean(a.encaixe));
    setModoSemCadastroAgendamento(Boolean(a.cliente.semCadastro));

    if (a.cliente.semCadastro) {
      setNovoNomeCliente(a.cliente.nome || '');
      setNovoCelularCliente(a.cliente.celular === 'Sem cadastro' ? '' : a.cliente.celular || '');
      setNovoEmailCliente(a.cliente.email || '');
      setNovoCpfCliente('');
      setNovoNiverCliente('');
      setNovaFotoCliente('');
    }

    setTelaAtiva('NovoAgendamento');
  };

  const cancelarAgendamento = () => {
    if (!agendamentoSelecionado) {
      Alert.alert('Atenção', 'Nenhum agendamento selecionado.');
      return;
    }

    setMotivoCancelamento(agendamentoSelecionado.cancelamentoMotivo || '');
    setModalCancelamentoVisivel(true);
  };

  const confirmarCancelamento = async () => {
    if (!agendamentoSelecionado) {
      Alert.alert('Atenção', 'Nenhum agendamento selecionado.');
      return;
    }

    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      Alert.alert('Motivo obrigatorio', 'Informe o motivo do cancelamento antes de desmarcar.');
      return;
    }

    setAcaoEmAndamento(true);

    const cancelado = {
      ...agendamentoSelecionado,
      status: 'Cancelado' as const,
      cancelamentoMotivo: motivo,
    };

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'Cancelado', cancelamento_motivo: motivo })
        .eq('id', agendamentoSelecionado.id);

      if (error) {
        Alert.alert('Erro Supabase cancelar', error.message);
        return;
      }
    } catch {
      Alert.alert('Erro', 'Nao consegui salvar o cancelamento no banco de dados.');
      return;
    } finally {
      setAcaoEmAndamento(false);
    }

    setAgendamentos((lista) => lista.map((a) => (a.id === cancelado.id ? cancelado : a)));
    setModalCancelamentoVisivel(false);
    setMotivoCancelamento('');
    setAgendamentoSelecionado(null);
    setTelaAtiva('Agenda');
    Alert.alert('Pronto', 'Horario cancelado com motivo salvo.');
  };

  const enviarLembreteWhatsApp = async (agendamento: Agendamento) => {
    const telefone = telefoneWhatsApp(agendamento.cliente.celular);

    if (!telefone) {
      Alert.alert('Sem celular', 'Esse agendamento não tem celular para enviar WhatsApp.');
      return;
    }

    const texto = encodeURIComponent(mensagemLembrete(agendamento));
    const url = `https://wa.me/${telefone}?text=${texto}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp', 'Não consegui abrir o WhatsApp neste aparelho.');
    }
  };

  const enviarConfirmacaoAgendamentoWhatsApp = async (agendamento: Agendamento) => {
    const telefone = telefoneWhatsApp(agendamento.cliente.celular);

    if (!telefone) {
      Alert.alert('Sem celular', 'Esse agendamento nao tem celular para enviar WhatsApp.');
      return;
    }

    const texto = encodeURIComponent(mensagemConfirmacaoAgendamento(agendamento));
    const url = `https://wa.me/${telefone}?text=${texto}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp', 'Nao consegui abrir o WhatsApp neste aparelho.');
    }
  };

  const enviarAniversarioWhatsApp = async (cliente: Cliente) => {
    const telefone = telefoneWhatsApp(cliente.celular);

    if (!telefone) {
      Alert.alert('Sem celular', 'Esse cliente nao tem celular para enviar WhatsApp.');
      return;
    }

    const texto = encodeURIComponent(mensagemAniversario(cliente));
    const url = `https://wa.me/${telefone}?text=${texto}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp', 'Nao consegui abrir o WhatsApp neste aparelho.');
    }
  };

  const atualizarSenhaMeuCadastro = async () => {
    const novaSenha = novaSenhaMeuCadastro.trim();

    if (acaoEmAndamento) return;

    if (!novaSenha) {
      Alert.alert('Atenção', 'Digite a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) {
        Alert.alert('Erro ao atualizar senha', error.message);
        return;
      }

      setNovaSenhaMeuCadastro('');
      setMostrarSenhaMeuCadastro(false);
      Alert.alert('Pronto', 'Sua senha foi atualizada.');
    } catch {
      Alert.alert('Erro', 'Nao consegui atualizar sua senha agora.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const salvarSenhaRecuperada = async () => {
    const novaSenha = novaSenhaRecuperacao.trim();
    const confirmacao = confirmarSenhaRecuperacao.trim();

    if (acaoEmAndamento) return;

    if (!novaSenha || !confirmacao) {
      Alert.alert('Atenção', 'Preencha a nova senha e a confirmação.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmacao) {
      Alert.alert('Senhas diferentes', 'A confirmação precisa ser igual à nova senha.');
      return;
    }

    setAcaoEmAndamento(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) {
        Alert.alert('Erro ao salvar senha', error.message);
        return;
      }

      setNovaSenhaRecuperacao('');
      setConfirmarSenhaRecuperacao('');
      setMostrarSenhaRecuperacao(false);
      setMostrarConfirmarSenhaRecuperacao(false);
      await supabase.auth.signOut();
      Alert.alert('Pronto', 'Senha atualizada. Entre novamente com sua nova senha.');
      setTelaAtiva('Agenda');
    } catch {
      Alert.alert('Erro', 'Nao consegui salvar a nova senha agora.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const salvarBloqueio = async () => {
    if (perfil !== 'admin') {
      Alert.alert('Acesso bloqueado', 'Somente a Vanessa pode bloquear horários.');
      return;
    }

    if (horarioOcupado(dataISOSelecionada, horarioSelecionado)) {
      Alert.alert('Horário ocupado', 'Não dá para bloquear um horário já agendado.');
      return;
    }

    if (horarioBloqueado(dataISOSelecionada, horarioSelecionado)) {
      Alert.alert('Já bloqueado', 'Esse horário já está bloqueado.');
      return;
    }

    const novo: Bloqueio = {
      id: Date.now().toString(),
      dataISO: dataISOSelecionada,
      horario: horarioSelecionado,
      motivo: motivoBloqueio || 'Bloqueado',
    };

    const { error } = await supabase
      .from('bloqueios')
      .insert(bloqueioParaBanco(novo));

    if (error) {
      Alert.alert('Não consegui bloquear', 'Esse horário pode já estar bloqueado ou reservado.');
      return;
    }

    setBloqueios((lista) => [novo, ...lista]);
    setMotivoBloqueio('');
    setTelaAtiva('Agenda');
    Alert.alert('Pronto', 'Horário bloqueado.');
  };

  const removerBloqueio = (id: string) => {
    if (perfil !== 'admin') return;

    supabase
      .from('bloqueios')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) Alert.alert('Erro Supabase liberar bloqueio', error.message);
      });

    setBloqueios((lista) => lista.filter((b) => b.id !== id));
  };



  const gerarBackupAutomatico = async () => {
    const pacote = {
      geradoEm: new Date().toISOString(),
      clientes,
      servicos,
      agendamentos,
      bloqueios,
    };

    const texto = JSON.stringify(pacote, null, 2);
    await AsyncStorage.setItem(STORAGE_KEYS.backup, texto);

    try {
      await supabase.from('backups').insert({
        id: Date.now().toString(),
        geradoem: new Date().toISOString(),
        dados: pacote,
      });
    } catch {
      // Backup online só funciona depois de criar a tabela backups.
    }
  };

  const gerarBackup = async () => {
    const pacote = {
      geradoEm: new Date().toISOString(),
      clientes,
      servicos,
      agendamentos,
      bloqueios,
    };

    const texto = JSON.stringify(pacote, null, 2);
    setBackupTexto(texto);
    await AsyncStorage.setItem(STORAGE_KEYS.backup, texto);
    await supabase.from('backups').insert({
      id: Date.now().toString(),
      geradoem: new Date().toISOString(),
      dados: pacote,
    });
    Alert.alert('Backup gerado', 'Backup gerado localmente e enviado para o Supabase.');
  };

  const totalFinanceiro = agendamentos
    .filter((a) => a.status !== 'Cancelado')
    .reduce((total, item) => total + valorServicoNumero(item.servico.preco), 0);

  const totalConfirmados = agendamentos.filter((a) => a.confirmado && a.status !== 'Cancelado').length;

  const AppHeader = () => (
    <View style={styles.topHeader}>
      <View style={styles.logoCircle}>
        <Image source={logoVanessa} style={styles.logoImageSmall} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.brandName}>Vanessa Rorig</Text>
        <Text style={styles.brandSub}>
          {perfil === 'admin' ? 'Painel da Vanessa' : 'Área do cliente'}
        </Text>
      </View>

      <Text style={styles.screenTitle}>{tituloTela()}</Text>
    </View>
  );

  const BottomMenu = () => (
    <View style={styles.tabBarInferior}>
      <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtiva('Comandas')}>
        <MaterialCommunityIcons name="file-document-outline" size={21} color={colors.muted} />
        <Text style={styles.tabTexto}>{perfil === 'admin' ? 'Comandas' : 'Meus horários'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, telaAtiva === 'Agenda' && styles.tabItemAtivo]}
        onPress={() => setTelaAtiva('Agenda')}
      >
        <MaterialCommunityIcons
          name="calendar-month"
          size={23}
          color={telaAtiva === 'Agenda' ? '#FFF' : colors.muted}
        />
        <Text style={[styles.tabTexto, telaAtiva === 'Agenda' && styles.tabTextoAtivo]}>
          Agenda
        </Text>
      </TouchableOpacity>

      {perfil === 'admin' && (
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtiva('Clientes')}>
          <FontAwesome5 name="users" size={18} color={colors.muted} />
          <Text style={styles.tabTexto}>Clientes</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtiva('Menu')}>
        <MaterialCommunityIcons name="menu" size={23} color={colors.muted} />
        <Text style={styles.tabTexto}>Menu</Text>
      </TouchableOpacity>
    </View>
  );

  const BackgroundLogo = () => (
    <View pointerEvents="none" style={styles.backgroundLogoWrapper}>
      <Image source={logoVanessa} style={styles.backgroundLogo} />
    </View>
  );


  const escolherFotoCliente = async () => {
    try {
      const ImagePicker = require('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setNovaFotoCliente(uri);
    } catch {
      Alert.alert('Foto', 'Instale expo-image-picker ou informe uma URL da foto.');
    }
  };

  const RenderLogin = () => {
    if (telaAtiva === 'AtualizarSenha') {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.loginShell}>
            <BackgroundLogo />
            <View style={styles.loginLogo}>
              <Image source={logoVanessa} style={styles.loginLogoImage} />
            </View>

            <Text style={styles.loginTitle}>Nova senha</Text>
            <Text style={styles.loginSub}>Digite e confirme sua nova senha de acesso.</Text>

            <View style={styles.loginCard}>
              <Text style={styles.loginSection}>Atualizar senha</Text>

              <View style={styles.senhaWrap}>
                <TextInput
                  style={[styles.inputForm, styles.senhaInput]}
                  placeholder="Nova senha"
                  secureTextEntry={!mostrarSenhaRecuperacao}
                  value={novaSenhaRecuperacao}
                  onChangeText={setNovaSenhaRecuperacao}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.senhaToggle}
                  onPress={() => setMostrarSenhaRecuperacao((valor) => !valor)}
                >
                  <MaterialCommunityIcons
                    name={mostrarSenhaRecuperacao ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.senhaWrap}>
                <TextInput
                  style={[styles.inputForm, styles.senhaInput]}
                  placeholder="Confirmar nova senha"
                  secureTextEntry={!mostrarConfirmarSenhaRecuperacao}
                  value={confirmarSenhaRecuperacao}
                  onChangeText={setConfirmarSenhaRecuperacao}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.senhaToggle}
                  onPress={() => setMostrarConfirmarSenhaRecuperacao((valor) => !valor)}
                >
                  <MaterialCommunityIcons
                    name={mostrarConfirmarSenhaRecuperacao ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btnCliente, acaoEmAndamento && styles.btnDesabilitado]}
                onPress={salvarSenhaRecuperada}
                disabled={acaoEmAndamento}
              >
                <Text style={styles.btnClienteTexto}>
                  {acaoEmAndamento ? 'Salvando...' : 'Salvar nova senha'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    if (telaAtiva === 'RecuperarSenha') {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.loginShell}>
            <BackgroundLogo />
            <View style={styles.loginLogo}>
              <Image source={logoVanessa} style={styles.loginLogoImage} />
            </View>
            <Text style={styles.loginTitle}>Recuperar acesso</Text>
            <Text style={styles.loginSub}>
              Digite seu e-mail para receber o link de recuperação.
            </Text>

            <View style={styles.loginCard}>
              <Text style={styles.loginSection}>E-mail cadastrado</Text>

              <TextInput
                style={styles.inputForm}
                placeholder="E-mail"
                keyboardType="email-address"
                value={emailAuth}
                onChangeText={setEmailAuth}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.btnCliente, acaoEmAndamento && styles.btnDesabilitado]}
                onPress={() => recuperarSenha()}
                disabled={acaoEmAndamento}
              >
                <Text style={styles.btnClienteTexto}>
                  {acaoEmAndamento ? 'Enviando...' : 'Enviar link de recuperação'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnSalvarInterno} onPress={() => setTelaAtiva('Agenda')}>
              <Text style={styles.btnSalvarTexto}>Voltar para entrada</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    if (modoCadastroPublico) {
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView
            contentContainerStyle={styles.cadastroShellScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cadastroLogoWrap}>
              <Image source={logoVanessa} style={styles.cadastroLogoImage} />
            </View>

            <Text style={styles.loginTitle}>Criar cadastro</Text>
            <Text style={styles.loginSub}>Depois do cadastro você escolhe data e horário.</Text>

            <View style={styles.loginCard}>
              <Text style={styles.loginSection}>Sou novo aqui</Text>

              <TextInput
                style={styles.inputForm}
                placeholder="Nome completo"
                value={novoNomeCliente}
                onChangeText={setNovoNomeCliente}
                autoCorrect={false}
              />

              <TextInput
                style={styles.inputForm}
                placeholder="Celular"
                keyboardType="phone-pad"
                value={novoCelularCliente}
                onChangeText={setNovoCelularCliente}
                autoCorrect={false}
              />

              <TextInput
                style={styles.inputForm}
                placeholder="E-mail"
                keyboardType="email-address"
                value={novoEmailCliente}
                onChangeText={setNovoEmailCliente}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.inputForm}
                placeholder="URL da foto (opcional)"
                value={novaFotoCliente}
                onChangeText={setNovaFotoCliente}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.btnCliente} onPress={escolherFotoCliente}>
                <Text style={styles.btnClienteTexto}>Escolher foto</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.inputForm}
                placeholder="CPF (opcional)"
                keyboardType="numeric"
                value={novoCpfCliente}
                onChangeText={setNovoCpfCliente}
                autoCorrect={false}
              />

              <TextInput
                style={styles.inputForm}
                placeholder="Aniversário (opcional)"
                value={novoNiverCliente}
                onChangeText={setNovoNiverCliente}
                autoCorrect={false}
              />

              <View style={styles.senhaWrap}>
                <TextInput
                  style={[styles.inputForm, styles.senhaInput]}
                  placeholder="Senha para acesso"
                  secureTextEntry={!mostrarSenhaCadastro}
                  value={senhaAuth}
                  onChangeText={setSenhaAuth}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.senhaToggle}
                  onPress={() => setMostrarSenhaCadastro((valor) => !valor)}
                >
                  <MaterialCommunityIcons
                    name={mostrarSenhaCadastro ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btnSalvarInterno, acaoEmAndamento && styles.btnDesabilitado]}
                onPress={criarCadastroClienteNovoSeguro}
                disabled={acaoEmAndamento}
              >
                <Text style={styles.btnSalvarTexto}>
                  {acaoEmAndamento ? 'Salvando cadastro...' : 'Criar conta e escolher horário'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnVoltarLogin}
                disabled={acaoEmAndamento}
                onPress={() => {
                  setModoCadastroPublico(false);
                  limparFormCliente();
                }}
              >
                <Text style={styles.btnVoltarLoginTexto}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.loginShellScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackgroundLogo />
          <View style={styles.loginLogo}>
            <Image source={logoVanessa} style={styles.loginLogoImage} />
          </View>

          <Text style={styles.loginTitle}>Vanessa Rorig</Text>
          <Text style={styles.loginSub}>Cura • Transformação • Conexão</Text>
          <View style={styles.premiumBadge}>
            <MaterialCommunityIcons name="star-four-points" size={15} color={colors.gold} />
            <Text style={styles.premiumBadgeTexto}>Agenda particular de atendimentos</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginSection}>Entrar como Vanessa</Text>

            <TextInput
              style={styles.inputForm}
              placeholder="E-mail da Vanessa"
              keyboardType="email-address"
              value={emailAdmin}
              onChangeText={setEmailAdmin}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.senhaWrap}>
              <TextInput
                style={[styles.inputForm, styles.senhaInput]}
                placeholder="Senha"
                secureTextEntry={!mostrarSenhaAdmin}
                value={senhaAdmin}
                onChangeText={setSenhaAdmin}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.senhaToggle}
                onPress={() => setMostrarSenhaAdmin((valor) => !valor)}
              >
                <MaterialCommunityIcons
                  name={mostrarSenhaAdmin ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnSalvarInterno, acaoEmAndamento && styles.btnDesabilitado]}
              onPress={entrarAdmin}
              disabled={acaoEmAndamento}
            >
              <Text style={styles.btnSalvarTexto}>
                {acaoEmAndamento ? 'Entrando...' : 'Entrar como admin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnVoltarLogin}
              onPress={() => recuperarSenha(emailAdmin)}
            >
              <Text style={styles.btnVoltarLoginTexto}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginSection}>Já sou cliente</Text>

            <TextInput
              style={styles.inputForm}
              placeholder="E-mail"
              keyboardType="email-address"
              value={emailAuth}
              onChangeText={setEmailAuth}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.senhaWrap}>
              <TextInput
                style={[styles.inputForm, styles.senhaInput]}
                placeholder="Senha"
                secureTextEntry={!mostrarSenhaClienteLogin}
                value={senhaAuth}
                onChangeText={setSenhaAuth}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.senhaToggle}
                onPress={() => setMostrarSenhaClienteLogin((valor) => !valor)}
              >
                <MaterialCommunityIcons
                  name={mostrarSenhaClienteLogin ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnCliente, acaoEmAndamento && styles.btnDesabilitado]}
              onPress={entrarComEmailSeguro}
              disabled={acaoEmAndamento}
            >
              <Text style={styles.btnClienteTexto}>
                {acaoEmAndamento ? 'Entrando...' : 'Entrar com e-mail'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnVoltarLogin} onPress={() => recuperarSenha()}>
              <Text style={styles.btnVoltarLoginTexto}>Recuperar senha</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.btnCadastroPublico}
            onPress={() => {
              limparFormCliente();
              setModoCadastroPublico(true);
            }}
          >
            <Text style={styles.btnCadastroPublicoTexto}>Sou novo aqui / Quero me cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnAgendarRapido} onPress={entrarVisitante}>
            <Text style={styles.btnAgendarRapidoTexto}>Agendar sem criar conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const RenderAgenda = () => (
    <View style={styles.containerTela}>
      <View style={styles.calendarCard}>
        <View style={styles.headerMes}>
          <TouchableOpacity onPress={() => mudarSemana(-1)} style={styles.roundBtn}>
            <Text style={styles.setaMes}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.textoMes}>
            {nomesMeses[dataSelecionada.getMonth()]} {dataSelecionada.getFullYear()}
          </Text>

          <TouchableOpacity onPress={() => mudarSemana(1)} style={styles.roundBtn}>
            <Text style={styles.setaMes}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.semanaCompactaGrid}>
          {diasSemanaVisivel.map((data, idx) => {
            const iso = toISODate(data);
            const selecionado = iso === dataISOSelecionada;
            const temAgenda = agendamentos.some(
              (a) => a.dataISO === iso && a.status !== 'Cancelado'
            );
            const temBloqueio = bloqueios.some((b) => b.dataISO === iso);

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.diaSemanaCompacto, selecionado && styles.diaSelecionado]}
                onPress={() => {
                  setDataSelecionada(data);
                  setMesAnoVisivel(new Date(data.getFullYear(), data.getMonth(), 1));
                }}
              >
                <Text style={[styles.semanaTextoCompacto, selecionado && styles.semanaTextoCompactoAtivo]}>
                  {diasSemana[idx]}
                </Text>
                <Text style={[styles.diaNumero, selecionado && { color: '#FFF' }]}>
                  {data.getDate()}
                </Text>

                <View style={styles.dotRow}>
                  {temAgenda && (
                    <View style={[styles.pontoAgenda, selecionado && { backgroundColor: '#FFF' }]} />
                  )}
                  {temBloqueio && (
                    <View
                      style={[styles.pontoBloqueio, selecionado && { backgroundColor: '#FFD36E' }]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.containerProfissionaisVanessa}>
        <View style={styles.profVanessaCard}>
          <View style={[styles.avatarFake, styles.avatarAtivo]}>
            <Image source={logoVanessa} style={styles.avatarLogo} />
          </View>

          <View style={{ marginLeft: 10 }}>
            <Text style={styles.profNomeAtivo}>Vanessa Rorig</Text>
            <Text style={styles.profSubTexto}>Profissional responsável</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.agendaScroll}
        contentContainerStyle={styles.agendaScrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        overScrollMode="always"
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom: 150 }}
      >
        {horarios.map((hora) => {
          const agendado = agendamentosDoDia.find((a) => a.horario === hora);
          const ocupadoPorDuracao = !agendado ? agendamentoNoIntervalo(dataISOSelecionada, hora, 30) : null;
          const bloqueado = bloqueiosDoDia.find((b) => b.horario === hora);

          if (agendado) {
            const podeVerDetalhes = perfil === 'admin' || agendamentoDoClienteAtual(agendado);

            return (
              <TouchableOpacity
                key={agendado.id}
                style={[styles.cardOcupado, !podeVerDetalhes && styles.cardOcupadoPrivado]}
                onPress={() => {
                  if (!podeVerDetalhes) {
                    Alert.alert('Horario ocupado', 'Esse horario ja esta reservado.');
                    return;
                  }

                  setAgendamentoSelecionado(agendado);
                  setTelaAtiva('Comanda');
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardOcupadoHora}>{agendado.horario}</Text>
                  <Text style={styles.statusPill}>
                    {podeVerDetalhes ? 'Agendado' : 'Ocupado'}
                  </Text>
                </View>

                <Text style={styles.cardOcupadoTitulo}>
                  {podeVerDetalhes
                    ? `${agendado.servico.nome} - ${agendado.cliente.nome}${agendado.cliente.semCadastro ? ' (sem cadastro)' : ''}`
                    : 'Horario indisponivel'}
                </Text>
                {podeVerDetalhes && (
                  <Text style={styles.cardOcupadoObs}>{duracaoAgendamento(agendado)} min</Text>
                )}

                {podeVerDetalhes && !!agendado.observacao && (
                  <Text style={styles.cardOcupadoObs}>{agendado.observacao}</Text>
                )}
              </TouchableOpacity>
            );
          }

          if (ocupadoPorDuracao) {
            return (
              <View key={`${hora}-ocupado`} style={styles.blocoHoraOcupado}>
                <Text style={styles.textoHora}>{hora}</Text>
                <Text style={styles.ocupadoDuracaoTexto}>
                  {perfil === 'admin' || agendamentoDoClienteAtual(ocupadoPorDuracao)
                    ? `Ocupado por ${ocupadoPorDuracao.servico.nome}`
                    : 'Horario indisponivel'}
                </Text>
              </View>
            );
          }

          if (bloqueado) {
            return (
              <TouchableOpacity
                key={bloqueado.id}
                style={styles.cardBloqueado}
                onPress={() =>
                  perfil === 'admin'
                    ? removerBloqueio(bloqueado.id)
                    : Alert.alert('Indisponível', 'Esse horário está bloqueado.')
                }
              >
                <Text style={styles.bloqueadoHora}>{hora}</Text>
                <Text style={styles.bloqueadoTexto}>
                  {perfil === 'admin' ? `Bloqueado - ${bloqueado.motivo}` : 'Indisponivel'}
                </Text>
                {perfil === 'admin' && <Text style={styles.bloqueadoHint}>Toque para liberar</Text>}
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={hora}
              style={styles.blocoHora}
              onPress={() => {
                setHorarioSelecionado(hora);
                setModalOpcoesVisivel(true);
              }}
            >
              <Text style={styles.textoHora}>{hora}</Text>
              <View style={styles.linhaHora} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footerAcoes}>
        <TouchableOpacity
          style={styles.btnHoje}
          onPress={() => {
            const hoje = new Date();
            setMesAnoVisivel(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
            setDataSelecionada(hoje);
          }}
        >
          <Text style={styles.btnHojeTexto}>↑ Hoje</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnFlutuante} onPress={() => setTelaAtiva('NovoAgendamento')}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <BottomMenu />

      <Modal visible={modalOpcoesVisivel} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalOpcoesVisivel(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderHeader}>
              <Text style={styles.modalHeaderText}>
                {formatarData(dataSelecionada)} {horarioSelecionado}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalBotaoOpcao}
              onPress={() => {
                setModalOpcoesVisivel(false);
                setTelaAtiva('NovoAgendamento');
              }}
            >
              <Text style={styles.modalBotaoTexto}>Agendar horário</Text>
            </TouchableOpacity>

            {perfil === 'admin' && (
              <>
                <View style={styles.modalLine} />
                <TouchableOpacity
                  style={styles.modalBotaoOpcao}
                  onPress={() => {
                    setModalOpcoesVisivel(false);
                    setTelaAtiva('BloquearHorarios');
                  }}
                >
                  <Text style={styles.modalBotaoTexto}>Bloquear horário</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const RenderNovoAgendamento = () => (
    <View style={styles.containerTela}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {agendamentoEditandoId && (
          <View style={styles.edicaoBanner}>
            <Text style={styles.edicaoBannerTexto}>Editando agendamento existente</Text>
          </View>
        )}

        <Text style={styles.tituloSecao}>DATA E HORA</Text>

        <View style={styles.dataHoraEditor}>
        <View style={styles.linhaFormRow}>
          <View style={styles.centerCell}>
            <Text style={styles.subLabel}>Data</Text>
            <Text style={styles.destaqueTexto}>{formatarData(dataSelecionada)}</Text>
          </View>

          <View style={styles.centerCell}>
            <Text style={styles.subLabel}>Início</Text>
            <Text style={styles.destaqueTexto}>{horarioSelecionado}</Text>
          </View>
        </View>

          <View style={styles.dataControls}>
            <TouchableOpacity style={styles.dataControlBtn} onPress={() => mudarDataAgendamento(-1)}>
              <Ionicons name="chevron-back" size={18} color={colors.primaryDark} />
              <Text style={styles.dataControlText}>Dia anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dataControlBtn} onPress={selecionarHojeAgendamento}>
              <Text style={styles.dataControlText}>Hoje</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dataControlBtn} onPress={() => mudarDataAgendamento(1)}>
              <Text style={styles.dataControlText}>Proximo dia</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.horariosPicker}>
            {horarios.map((hora) => {
              const ativo = horarioSelecionado === hora;
              const ocupado = horarioOcupado(dataISOSelecionada, hora, duracaoServico(servicoSelecionado), agendamentoEditandoId);
              const bloqueado = horarioBloqueado(dataISOSelecionada, hora, duracaoServico(servicoSelecionado));
              const indisponivel = ocupado || bloqueado;

              return (
                <TouchableOpacity
                  key={hora}
                  style={[
                    styles.horarioChip,
                    ativo && styles.horarioChipAtivo,
                    indisponivel && styles.horarioChipIndisponivel,
                  ]}
                  disabled={indisponivel}
                  onPress={() => setHorarioSelecionado(hora)}
                >
                  <Text
                    style={[
                      styles.horarioChipTexto,
                      ativo && styles.horarioChipTextoAtivo,
                      indisponivel && styles.horarioChipTextoIndisponivel,
                    ]}
                  >
                    {hora}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.tituloSecao}>TIPO DO AGENDAMENTO</Text>

        <View style={styles.linhaFormItem}>
          <Text style={styles.formLabel}>Encaixe</Text>
          <Switch value={isEncaixe} onValueChange={setIsEncaixe} trackColor={{ true: colors.primary }} />
        </View>

        <Text style={styles.tituloSecao}>PROFISSIONAL</Text>

        <View style={styles.linhaFormItem}>
          <Text style={styles.formLabel}>Vanessa</Text>
        </View>

        <Text style={styles.tituloSecao}>CLIENTE</Text>

        {!modoSemCadastroAgendamento && (perfil === 'admin' || clienteSelecionado) ? (
          <View style={styles.linhaFormItem}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                if (perfil === 'admin') setTelaAtiva('Clientes');
              }}
            >
              <Text style={[styles.formLabel, clienteSelecionado && { color: colors.primaryDark }]}>
                {clienteSelecionado ? clienteSelecionado.nome : 'Escolher cliente'}
              </Text>
            </TouchableOpacity>

            {perfil === 'admin' && (
              <View style={styles.clienteActions}>
                <TouchableOpacity
                  style={styles.clienteActionBtn}
                  onPress={() => {
                    setClienteSelecionado(null);
                    limparFormCliente();
                    setModoSemCadastroAgendamento(true);
                  }}
                >
                  <Text style={styles.linkText}>Sem cadastro</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.clienteActionBtn} onPress={abrirNovoCliente}>
                  <Text style={styles.linkText}>+ Novo cliente</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.formInlineBox}>
            {perfil === 'admin' && (
              <Text style={styles.formHint}>
                Agendamento sem cadastro: preencha só uma identificação para aparecer na agenda.
              </Text>
            )}

            <TextInput
              style={styles.inputForm}
              placeholder="Nome ou observação do cliente"
              value={novoNomeCliente}
              onChangeText={setNovoNomeCliente}
              autoCorrect={false}
            />

            <TextInput
              style={styles.inputForm}
              placeholder="Celular / WhatsApp (opcional)"
              keyboardType="phone-pad"
              value={novoCelularCliente}
              onChangeText={setNovoCelularCliente}
              autoCorrect={false}
            />

            <TextInput
              style={styles.inputForm}
              placeholder="E-mail (opcional)"
              keyboardType="email-address"
              value={novoEmailCliente}
              onChangeText={setNovoEmailCliente}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {perfil === 'admin' && (
              <TouchableOpacity
                style={styles.btnVoltarLogin}
                onPress={() => {
                  setModoSemCadastroAgendamento(false);
                  limparFormCliente();
                }}
              >
                <Text style={styles.btnVoltarLoginTexto}>Voltar para escolher cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.tituloSecao}>ESCOLHA O SERVIÇO</Text>

        <TouchableOpacity style={styles.linhaFormItem} onPress={() => setTelaAtiva('Servicos')}>
          <Text style={[styles.formLabel, servicoSelecionado && { color: colors.primaryDark }]}>
            {servicoSelecionado
              ? `${servicoSelecionado.nome} - ${servicoSelecionado.preco} - ${duracaoServico(servicoSelecionado)} min`
              : 'Escolher serviço'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tituloSecao}>OBSERVAÇÃO</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.inputObservacao}
            placeholder="Digite uma observação (opcional)"
            placeholderTextColor="#B8B1C5"
            value={observacao}
            onChangeText={setObservacao}
            autoCorrect={false}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.btnSalvarPrincipal, acaoEmAndamento && styles.btnDesabilitado]}
        onPress={salvarAgendamento}
        disabled={acaoEmAndamento}
      >
        <Text style={styles.btnSalvarTexto}>
          {acaoEmAndamento
            ? 'Salvando no banco...'
            : agendamentoEditandoId
              ? 'Atualizar agendamento'
              : 'Agendar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const RenderNovoCadastro = () => (
    <View style={styles.containerTela}>
      <Text style={styles.tituloSecao}>INFORMAÇÕES PESSOAIS</Text>

      <ScrollView style={{ padding: 20 }}>
        <TextInput
          style={styles.inputForm}
          placeholder="Nome completo"
          value={novoNomeCliente}
          onChangeText={setNovoNomeCliente}
          autoCorrect={false}
        />

        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <View style={styles.boxDdi}>
            <Text>🇧🇷</Text>
          </View>

          <TextInput
            style={[styles.inputForm, { flex: 1, marginBottom: 0, marginLeft: 10 }]}
            placeholder="Celular"
            keyboardType="phone-pad"
            value={novoCelularCliente}
            onChangeText={setNovoCelularCliente}
            autoCorrect={false}
          />
        </View>

        <TextInput
          style={styles.inputForm}
          placeholder="E-mail"
          keyboardType="email-address"
          value={novoEmailCliente}
          onChangeText={setNovoEmailCliente}
          autoCorrect={false}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.inputForm}
          placeholder="URL da foto do cliente"
          value={novaFotoCliente}
          onChangeText={setNovaFotoCliente}
          autoCorrect={false}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.inputForm}
          placeholder="CPF"
          keyboardType="numeric"
          value={novoCpfCliente}
          onChangeText={setNovoCpfCliente}
          autoCorrect={false}
        />

        <TextInput
          style={styles.inputForm}
          placeholder="Aniversário"
          value={novoNiverCliente}
          onChangeText={setNovoNiverCliente}
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.btnSalvarInterno, acaoEmAndamento && styles.btnDesabilitado]}
          onPress={salvarCliente}
          disabled={acaoEmAndamento}
        >
          <Text style={styles.btnSalvarTexto}>
            {acaoEmAndamento
              ? 'Salvando cliente...'
              : clienteEditandoId
                ? 'Atualizar cliente'
                : 'Salvar cliente'}
          </Text>
        </TouchableOpacity>

        {clienteEditandoId && perfil === 'admin' && (
          <TouchableOpacity
            style={[styles.btnCancelar, acaoEmAndamento && styles.btnDesabilitado]}
            disabled={acaoEmAndamento}
            onPress={() => {
              excluirCliente(clienteEditandoId);
              limparFormCliente();
            }}
          >
            <Text style={styles.btnCancelarTexto}>
              {acaoEmAndamento ? 'Excluindo...' : 'Excluir cliente'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const RenderClientes = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Área disponível somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Clientes cadastrados</Text>

          <TouchableOpacity onPress={abrirNovoCliente}>
            <Text style={styles.linkText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={clientes}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.rowServico}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  setClienteSelecionado(item);
                  setModoSemCadastroAgendamento(false);
                  setTelaAtiva('NovoAgendamento');
                }}
              >
                <Text style={styles.rowTitle}>{item.nome}</Text>
                <Text style={styles.rowSub}>
                  {item.celular} • {item.aniversario}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => editarCliente(item)}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  const RenderServicos = () => {
    const filtrados = servicos.filter((s) =>
      s.nome.toLowerCase().includes(buscaServico.toLowerCase())
    );

    return (
      <View style={styles.containerTela}>
        <View style={styles.searchArea}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.muted} />

            <TextInput
              style={{ flex: 1, height: 38, marginLeft: 8 }}
              placeholder="Pesquise pelo nome"
              value={buscaServico}
              onChangeText={setBuscaServico}
              autoCorrect={false}
            />
          </View>

          {perfil === 'admin' && (
            <TouchableOpacity style={styles.smallAddBtn} onPress={abrirNovoServico}>
              <Text style={styles.smallAddText}>+ Serviço</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtrados}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.rowServico}>
              <TouchableOpacity
                style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                onPress={() => {
                  setServicoSelecionado(item);
                  setTelaAtiva('NovoAgendamento');
                }}
              >
                <View style={styles.miniIconBox}>
                  <MaterialCommunityIcons name="content-cut" size={16} color={colors.primaryDark} />
                </View>

                <View>
                  <Text style={styles.rowTitle}>{item.nome}</Text>
                  <Text style={styles.rowSub}>{item.preco} • {duracaoServico(item)} min</Text>
                </View>
              </TouchableOpacity>

              {perfil === 'admin' && (
                <TouchableOpacity onPress={() => editarServico(item)}>
                  <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
    );
  };

  const RenderNovoServico = () => (
    <View style={styles.containerTela}>
      <Text style={styles.tituloSecao}>CADASTRAR SERVIÇO / PRODUTO</Text>

      <ScrollView style={{ padding: 20 }}>
        <TextInput
          style={styles.inputForm}
          placeholder="Nome do serviço ou produto"
          value={novoServicoNome}
          onChangeText={setNovoServicoNome}
          autoCorrect={false}
        />

        <TextInput
          style={styles.inputForm}
          placeholder="Valor. Ex: 20000 para R$ 200,00"
          keyboardType="numeric"
          value={novoServicoPreco}
          onChangeText={setNovoServicoPreco}
          autoCorrect={false}
        />

        <Text style={styles.formHint}>Tempo do serviço</Text>
        <View style={styles.durationRow}>
          {['30', '60', '90', '120'].map((minutos) => (
            <TouchableOpacity
              key={minutos}
              style={[
                styles.durationBtn,
                novoServicoDuracao === minutos && styles.durationBtnAtivo,
              ]}
              onPress={() => setNovoServicoDuracao(minutos)}
            >
              <Text
                style={[
                  styles.durationBtnTexto,
                  novoServicoDuracao === minutos && styles.durationBtnTextoAtivo,
                ]}
              >
                {minutos} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnSalvarInterno} onPress={salvarServico}>
          <Text style={styles.btnSalvarTexto}>
            {servicoEditandoId ? 'Atualizar serviço' : 'Salvar serviço'}
          </Text>
        </TouchableOpacity>

        {servicoEditandoId && (
          <TouchableOpacity
            style={[styles.btnCancelar, acaoEmAndamento && styles.btnDesabilitado]}
            disabled={acaoEmAndamento}
            onPress={() => {
              excluirServico(servicoEditandoId);
            }}
          >
            <Text style={styles.btnCancelarTexto}>Excluir serviço</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const RenderComanda = () => {
    const a = agendamentoSelecionado;

    if (!a) {
      return (
        <View style={styles.containerTela}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhuma comanda/agendamento selecionado.</Text>

            <TouchableOpacity style={styles.btnSalvarInterno} onPress={() => setTelaAtiva('Agenda')}>
              <Text style={styles.btnSalvarTexto}>Voltar para agenda</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (perfil !== 'admin' && !agendamentoDoClienteAtual(a)) {
      return (
        <View style={styles.containerTela}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Esse agendamento nao pertence ao seu cadastro.</Text>

            <TouchableOpacity style={styles.btnSalvarInterno} onPress={() => setTelaAtiva('Agenda')}>
              <Text style={styles.btnSalvarTexto}>Voltar para agenda</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <>
      <Modal visible={modalCancelamentoVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderHeader}>
              <Text style={styles.modalHeaderText}>Motivo do cancelamento</Text>
            </View>

            <View style={{ padding: 14 }}>
              <Text style={styles.configLine}>
                Informe o motivo para salvar junto ao agendamento cancelado.
              </Text>

              <TextInput
                style={[styles.inputForm, { minHeight: 96, textAlignVertical: 'top' }]}
                placeholder="Ex: Cliente pediu para remarcar"
                value={motivoCancelamento}
                onChangeText={setMotivoCancelamento}
                multiline
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.btnSalvarInterno, acaoEmAndamento && styles.btnDesabilitado]}
                disabled={acaoEmAndamento}
                onPress={confirmarCancelamento}
              >
                <Text style={styles.btnSalvarTexto}>
                  {acaoEmAndamento ? 'Salvando...' : 'Confirmar cancelamento'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBotaoOpcao}
                onPress={() => {
                  setModalCancelamentoVisivel(false);
                  setMotivoCancelamento('');
                }}
              >
                <Text style={styles.modalBotaoTexto}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.containerTela} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.comandaBox}>
          <Text style={styles.comandaNumero}>Comanda nº {a.id.slice(-8)}</Text>

          <View style={styles.comandaHeader}>
            <View style={styles.avatarFake}>
              <Text style={styles.avatarTxt}>{a.cliente.nome[0]}</Text>
            </View>

            <Text style={styles.rowTitle}>{a.cliente.nome}</Text>
          </View>

          <View style={styles.metaComanda}>
            <Text style={styles.metaLabel}>Valor</Text>
            <Text style={styles.valorTxt}>{a.servico.preco}</Text>
          </View>

          <View style={styles.metaComanda}>
            <Text style={styles.metaLabel}>Serviço</Text>
            <Text style={styles.txtComandaValue}>{a.servico.nome}</Text>
          </View>

          <View style={styles.metaComanda}>
            <Text style={styles.metaLabel}>Data/Hora</Text>
            <Text style={styles.txtComandaValue}>
              {dataBR(a.dataISO)} {a.horario}
            </Text>
          </View>

          <View style={styles.metaComanda}>
            <Text style={styles.metaLabel}>Observação</Text>
            <Text style={styles.txtComandaValue}>{a.observacao || '-'}</Text>
          </View>

          {a.status === 'Cancelado' && (
            <View style={styles.metaComanda}>
              <Text style={styles.metaLabel}>Motivo cancelamento</Text>
              <Text style={styles.txtComandaValue}>{a.cancelamentoMotivo || '-'}</Text>
            </View>
          )}

          {perfil === 'admin' && (
            <View style={styles.metaComanda}>
              <Text style={styles.metaLabel}>Enviar confirmação</Text>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => enviarConfirmacaoAgendamentoWhatsApp(a)}
              >
                <FontAwesome5 name="whatsapp" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {perfil === 'admin' && (
            <View style={styles.metaComanda}>
              <Text style={styles.metaLabel}>Enviar lembrete</Text>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => enviarLembreteWhatsApp(a)}
              >
                <FontAwesome5 name="whatsapp" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaComanda}>
            <Text style={styles.metaLabel}>Celular</Text>
            <Text style={styles.txtComandaValue}>{a.cliente.celular || '-'}</Text>
          </View>
        </View>

        {perfil === 'admin' && (
        <View style={styles.comandaBox}>
          <View style={styles.comandaSwitchRow}>
            <Text style={styles.formLabel}>Confirmado</Text>
            <Switch value={Boolean(a.confirmado)} onValueChange={(valor) => alternarConfirmacaoAgendamento('confirmado', valor)} trackColor={{ true: colors.primary }} />
          </View>

          <View style={styles.comandaSwitchRow}>
            <Text style={styles.formLabel}>Preferência</Text>
            <Switch value={preferencia} onValueChange={setPreferencia} trackColor={{ true: colors.primary }} />
          </View>

          <View style={styles.comandaSwitchRow}>
            <Text style={styles.formLabel}>Presente</Text>
            <Switch value={Boolean(a.presente)} onValueChange={(valor) => alternarConfirmacaoAgendamento('presente', valor)} trackColor={{ true: colors.primary }} />
          </View>
        </View>
        )}

        {perfil === 'admin' && (
          <TouchableOpacity style={styles.btnEditarComanda} onPress={editarAgendamento}>
            <MaterialCommunityIcons name="calendar-edit" size={18} color={colors.primaryDark} />
            <Text style={styles.btnEditarComandaTexto}>Editar / Reagendar</Text>
          </TouchableOpacity>
        )}

        {perfil === 'admin' && (
          <TouchableOpacity style={styles.btnCancelar} onPress={cancelarAgendamento}>
            <Text style={styles.btnCancelarTexto}>Desmarcar / Cancelar horário</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnSalvarInterno} onPress={() => setTelaAtiva('Agenda')}>
          <Text style={styles.btnSalvarTexto}>Voltar para agenda</Text>
        </TouchableOpacity>
      </ScrollView>
      </>
    );
  };

  const RenderBloquearHorarios = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Somente Vanessa pode bloquear horários.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <View style={{ padding: 20 }}>
          <TextInput style={styles.inputForm} editable={false} value="Vanessa" />

          <TextInput
            style={styles.inputForm}
            editable={false}
            value={`${formatarData(dataSelecionada)} ${horarioSelecionado}`}
          />

          <TextInput
            style={styles.inputForm}
            placeholder="Motivo do bloqueio"
            value={motivoBloqueio}
            onChangeText={setMotivoBloqueio}
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity style={styles.btnSalvarPrincipal} onPress={salvarBloqueio}>
          <Text style={styles.btnSalvarTexto}>Salvar bloqueio</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const RenderMenu = () => (
    <View style={styles.containerTela}>
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Agenda')}>
          <MaterialCommunityIcons name="calendar-month" size={28} color={colors.primary} />
          <Text style={styles.menuText}>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Comandas')}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
          <Text style={styles.menuText}>
            {perfil === 'admin' ? 'Comandas' : 'Meus agendamentos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Servicos')}>
          <MaterialCommunityIcons name="content-cut" size={28} color={colors.primary} />
          <Text style={styles.menuText}>Serviços</Text>
        </TouchableOpacity>

        {perfil === 'cliente' && (
          <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('MeuCadastro')}>
            <FontAwesome5 name="user" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Meu cadastro</Text>
          </TouchableOpacity>
        )}

        {perfil === 'admin' && (
          <>
            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Clientes')}>
              <FontAwesome5 name="users" size={24} color={colors.primary} />
              <Text style={styles.menuText}>Clientes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Bloqueios')}>
              <MaterialCommunityIcons name="calendar-lock" size={28} color={colors.primary} />
              <Text style={styles.menuText}>Bloqueios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Aniversarios')}>
              <MaterialCommunityIcons name="cake-variant-outline" size={28} color={colors.primary} />
              <Text style={styles.menuText}>
                {aniversariosHoje.length ? `Aniversarios (${aniversariosHoje.length} hoje)` : 'Aniversarios'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={abrirNovoServico}>
              <MaterialCommunityIcons name="plus-box" size={28} color={colors.primary} />
              <Text style={styles.menuText}>Novo serviço</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Financeiro')}>
              <MaterialCommunityIcons name="cash-multiple" size={28} color={colors.primary} />
              <Text style={styles.menuText}>Financeiro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Backup')}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={colors.primary} />
              <Text style={styles.menuText}>Backup</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setTelaAtiva('Configuracoes')}>
              <MaterialCommunityIcons name="cog-outline" size={28} color={colors.primary} />
              <Text style={styles.menuText}>Configurações</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.menuCard} onPress={sair}>
          <MaterialCommunityIcons name="logout" size={28} color={colors.danger} />
          <Text style={styles.menuText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const RenderComandas = () => {
    const lista = agendamentos.filter(
      (a) => a.status !== 'Cancelado' && (perfil === 'admin' || a.cliente.id === clienteSelecionado?.id)
    );

    return (
      <View style={styles.containerTela}>
        <FlatList
          data={lista}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.rowServico}
              onPress={() => {
                setAgendamentoSelecionado(item);
                setTelaAtiva('Comanda');
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {perfil === 'admin' ? item.cliente.nome : item.servico.nome}
                </Text>
                <Text style={styles.rowSub}>
                  {item.servico.nome} • {dataBR(item.dataISO)} {item.horario}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const RenderBloqueios = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Área disponível somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <FlatList
          data={bloqueios}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum horário bloqueado.</Text>}
          renderItem={({ item }) => (
            <View style={styles.rowServico}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {dataBR(item.dataISO)} às {item.horario}
                </Text>
                <Text style={styles.rowSub}>{item.motivo}</Text>
              </View>

              <TouchableOpacity onPress={() => removerBloqueio(item.id)}>
                <Text style={styles.deleteText}>Liberar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  const RenderAniversarios = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Area disponivel somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 110 }}>
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Lembretes de aniversario</Text>
            <Text style={styles.configLine}>Clientes com aniversario cadastrado: {aniversariosOrdenados.length}</Text>
            <Text style={styles.configLine}>Aniversarios hoje: {aniversariosHoje.length}</Text>
          </View>

          {aniversariosHoje.length > 0 && (
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>Hoje</Text>
              {aniversariosHoje.map((item) => (
                <View key={`hoje-${item.cliente.id}`} style={styles.rowServico}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.cliente.nome}</Text>
                    <Text style={styles.rowSub}>
                      {item.dataTexto} - {item.cliente.celular || 'Sem celular'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.whatsappMiniBtn}
                    onPress={() => enviarAniversarioWhatsApp(item.cliente)}
                  >
                    <FontAwesome5 name="whatsapp" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Proximos aniversarios</Text>

          {aniversariosOrdenados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum aniversario cadastrado nos clientes.</Text>
          ) : (
            aniversariosOrdenados.slice(0, 40).map((item) => (
              <View key={item.cliente.id} style={styles.rowServico}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.cliente.nome}</Text>
                  <Text style={styles.rowSub}>
                    {item.dataTexto} - {item.cliente.celular || 'Sem celular'}
                  </Text>
                </View>

                <View style={styles.badgeAniversario}>
                  <Text style={styles.badgeAniversarioTexto}>{textoDiasAniversario(item.dias)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.whatsappMiniBtn}
                  onPress={() => enviarAniversarioWhatsApp(item.cliente)}
                >
                  <FontAwesome5 name="whatsapp" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const RenderFinanceiro = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Área disponível somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Resumo financeiro</Text>
            <Text style={styles.configLine}>Agendamentos ativos: {agendamentos.filter((a) => a.status !== 'Cancelado').length}</Text>
            <Text style={styles.configLine}>Agendamentos confirmados: {totalConfirmados}</Text>
            <Text style={styles.configLine}>Total previsto: {formatarDinheiro(totalFinanceiro)}</Text>
            <Text style={styles.configLine}>Comissão estimada Vanessa (100%): {formatarDinheiro(totalFinanceiro)}</Text>
          </View>

          <FlatList
            data={agendamentos.filter((a) => a.status !== 'Cancelado')}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum valor para mostrar.</Text>}
            renderItem={({ item }) => (
              <View style={styles.rowServico}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.servico.nome}</Text>
                  <Text style={styles.rowSub}>{item.cliente.nome} • {dataBR(item.dataISO)} {item.horario}</Text>
                </View>
                <Text style={styles.valorTxt}>{item.servico.preco}</Text>
              </View>
            )}
          />
        </ScrollView>
      </View>
    );
  };

  const RenderBackup = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Área disponível somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Backup automático/local</Text>
            <Text style={styles.configLine}>Clientes: {clientes.length}</Text>
            <Text style={styles.configLine}>Serviços: {servicos.length}</Text>
            <Text style={styles.configLine}>Agendamentos: {agendamentos.length}</Text>
            <Text style={styles.configLine}>Bloqueios: {bloqueios.length}</Text>
            <Text style={styles.configLine}>Banco online ativo: {bancoOnlineAtivo ? 'Sim' : 'Não configurado'}</Text>
          </View>

          <TouchableOpacity style={styles.btnSalvarInterno} onPress={gerarBackup}>
            <Text style={styles.btnSalvarTexto}>Gerar backup agora</Text>
          </TouchableOpacity>

          {!!backupTexto && (
            <TextInput
              style={[styles.inputForm, { minHeight: 180, marginTop: 15 }]}
              multiline
              value={backupTexto}
              editable={false}
            />
          )}
        </ScrollView>
      </View>
    );
  };

  const RenderConfiguracoes = () => {
    if (perfil !== 'admin') {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Área disponível somente para Vanessa.</Text>
        </View>
      );
    }

    return (
      <View style={styles.containerTela}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>Status do app</Text>
            <Text style={styles.configLine}>Perfil atual: Vanessa / Admin</Text>
            <Text style={styles.configLine}>Clientes salvos: {clientes.length}</Text>
            <Text style={styles.configLine}>Serviços salvos: {servicos.length}</Text>
            <Text style={styles.configLine}>
              Agendamentos ativos: {agendamentos.filter((a) => a.status !== 'Cancelado').length}
            </Text>
            <Text style={styles.configLine}>Bloqueios ativos: {bloqueios.length}</Text>
            <Text style={styles.configLine}>Banco online: {bancoOnlineAtivo ? 'Configurado' : 'Pendente'}</Text>
          </View>

          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={async () => {
              await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
              Alert.alert('Pronto', 'Dados locais apagados. Reabra o app para resetar.');
            }}
          >
            <Text style={styles.btnCancelarTexto}>Limpar dados locais</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const RenderMeuCadastro = () => {
    if (!clienteSelecionado) {
      return (
        <View style={styles.containerTela}>
          <Text style={styles.emptyText}>Nenhum cliente logado.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.containerTela} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.comandaBox}>
          <Text style={styles.configTitle}>Meu cadastro</Text>
          {!!clienteSelecionado.fotoUrl && (
            <Image source={{ uri: clienteSelecionado.fotoUrl }} style={styles.fotoCliente} />
          )}
          <Text style={styles.configLine}>Nome: {clienteSelecionado.nome}</Text>
          <Text style={styles.configLine}>Celular: {clienteSelecionado.celular}</Text>
          <Text style={styles.configLine}>E-mail: {clienteSelecionado.email || '-'}</Text>
          <Text style={styles.configLine}>Foto: {clienteSelecionado.fotoUrl || '-'}</Text>
          <Text style={styles.configLine}>CPF: {clienteSelecionado.cpf}</Text>
          <Text style={styles.configLine}>Aniversário: {clienteSelecionado.aniversario}</Text>
        </View>

        <View style={styles.comandaBox}>
          <Text style={styles.configTitle}>Minha senha</Text>
          <Text style={styles.configLine}>
            Por segurança, a senha atual não fica visível. Digite uma nova senha para trocar.
          </Text>

          <View style={styles.senhaWrap}>
            <TextInput
              style={[styles.inputForm, styles.senhaInput]}
              placeholder="Nova senha"
              secureTextEntry={!mostrarSenhaMeuCadastro}
              value={novaSenhaMeuCadastro}
              onChangeText={setNovaSenhaMeuCadastro}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.senhaToggle}
              onPress={() => setMostrarSenhaMeuCadastro((valor) => !valor)}
            >
              <MaterialCommunityIcons
                name={mostrarSenhaMeuCadastro ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnCliente, acaoEmAndamento && styles.btnDesabilitado]}
            disabled={acaoEmAndamento}
            onPress={atualizarSenhaMeuCadastro}
          >
            <Text style={styles.btnClienteTexto}>
              {acaoEmAndamento ? 'Salvando...' : 'Atualizar senha'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  if (!perfil || telaAtiva === 'AtualizarSenha' || telaAtiva === 'RecuperarSenha') return RenderLogin();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appShell}>
        <BackgroundLogo />
        <AppHeader />

        {telaAtiva !== 'Agenda' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setTelaAtiva('Agenda')}>
            <Ionicons name="chevron-back" size={23} color={colors.primaryDark} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        )}

        {telaAtiva === 'Agenda' && RenderAgenda()}
        {telaAtiva === 'NovoAgendamento' && RenderNovoAgendamento()}
        {telaAtiva === 'NovoCadastro' && RenderNovoCadastro()}
        {telaAtiva === 'Clientes' && RenderClientes()}
        {telaAtiva === 'Servicos' && RenderServicos()}
        {telaAtiva === 'NovoServico' && RenderNovoServico()}
        {telaAtiva === 'Comanda' && RenderComanda()}
        {telaAtiva === 'BloquearHorarios' && RenderBloquearHorarios()}
        {telaAtiva === 'Menu' && RenderMenu()}
        {telaAtiva === 'Comandas' && RenderComandas()}
        {telaAtiva === 'Bloqueios' && RenderBloqueios()}
        {telaAtiva === 'Aniversarios' && RenderAniversarios()}
        {telaAtiva === 'Financeiro' && RenderFinanceiro()}
        {telaAtiva === 'Backup' && RenderBackup()}
        {telaAtiva === 'Configuracoes' && RenderConfiguracoes()}
        {telaAtiva === 'MeuCadastro' && RenderMeuCadastro()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, alignItems: 'center', width: '100%' },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.background,
    shadowColor: '#6F4D7D',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  loginShell: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  loginShellScroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Platform.OS === 'web' ? 18 : 26,
    paddingTop: Platform.OS === 'web' ? 10 : 18,
    paddingBottom: Platform.OS === 'web' ? 36 : 120,
    position: 'relative',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  cadastroShellScroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Platform.OS === 'web' ? 18 : 26,
    paddingTop: Platform.OS === 'web' ? 10 : 16,
    paddingBottom: Platform.OS === 'web' ? 36 : 120,
  },
  loginLogo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#FFF7FA',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAD9B8',
    overflow: 'hidden',
    shadowColor: '#7A5B93',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  loginLogoImage: { width: 128, height: 128, resizeMode: 'cover' },
  cadastroLogoWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFF7FA',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    overflow: 'hidden',
  },
  cadastroLogoImage: { width: 92, height: 92, resizeMode: 'cover' },
  backgroundLogoWrapper: {
    position: 'absolute',
    width: 320,
    height: 320,
    alignSelf: 'center',
    top: 110,
    left: '50%',
    marginLeft: -160,
    zIndex: -1,
  },

  backgroundLogo: {
    position: 'absolute',
    width: 390,
    height: 390,
    resizeMode: 'contain',
    opacity: 0.09,
    alignSelf: 'center',
    top: 118,
    left: 20,
    zIndex: 0,
  },
  loginWatermark: {
    position: 'absolute',
    width: 390,
    height: 390,
    resizeMode: 'contain',
    opacity: 0.09,
    alignSelf: 'center',
    top: 118,
    left: 20,
    zIndex: 0,
  },
  loginLogoText: { fontSize: 27, fontWeight: '900', color: colors.primaryDark },
  loginTitle: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: 12,
  },
  loginSub: { textAlign: 'center', color: colors.muted, marginBottom: 12, letterSpacing: 1.2 },
  premiumBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: '#EAD9B8',
    marginBottom: 18,
  },
  premiumBadgeTexto: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  loginSection: { fontWeight: '900', color: colors.text, marginBottom: 10 },
  topHeader: {
    height: 62,
    backgroundColor: '#FFF7FA',
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7FA',
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  logoImageSmall: { width: 34, height: 34, resizeMode: 'cover' },
  logoLetters: { color: colors.primary, fontWeight: '900', fontSize: 12 },
  brandName: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  brandSub: { color: colors.muted, fontSize: 10, marginTop: 1 },
  screenTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.surface },
  backText: { color: colors.primaryDark, fontWeight: '800' },
  containerTela: { flex: 1, backgroundColor: 'transparent' },
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  headerMes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setaMes: { fontSize: 24, color: colors.primary, fontWeight: '900', marginTop: -2 },
  textoMes: { fontSize: 16, fontWeight: '900', color: colors.text },
  semanaCompactaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  diaSemanaCompacto: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  semanaTextoCompacto: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },
  semanaTextoCompactoAtivo: { color: '#FFF' },
  semanaGrid: { flexDirection: 'row', marginBottom: 4 },
  semanaTexto: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '800' },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  diaGridBox: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  diaSelecionado: { backgroundColor: colors.primaryDark, shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 8, elevation: 2 },
  diaNumero: { fontSize: 15, fontWeight: '900', color: colors.text },
  dotRow: { flexDirection: 'row', gap: 3, height: 7 },
  pontoAgenda: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
  pontoBloqueio: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warning, marginTop: 2 },
  containerProfissionaisVanessa: {
    marginHorizontal: 10,
    marginBottom: 3,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
  },
  profVanessaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  avatarFake: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.softLavender,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarAtivo: { backgroundColor: colors.primary },
  avatarLogo: { width: 38, height: 38, resizeMode: 'cover' },
  avatarTxt: { color: colors.primary, fontWeight: '900' },
  profNomeAtivo: { fontSize: 13, color: colors.primaryDark, fontWeight: '900' },
  profSubTexto: { fontSize: 11, color: colors.muted, marginTop: 2 },
  agendaScroll: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  agendaScrollContent: {
    paddingTop: 4,
    paddingBottom: 190,
  },
  blocoHora: { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 10 },
  blocoHoraOcupado: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 10,
    opacity: 0.68,
  },
  textoHora: { width: 48, fontSize: 11, color: colors.muted, textAlign: 'center' },
  ocupadoDuracaoTexto: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  linhaHora: { flex: 1, height: 1, backgroundColor: colors.border },
  cardOcupado: {
    backgroundColor: colors.scheduleBlue,
    padding: 14,
    borderRadius: 18,
    marginLeft: 60,
    marginRight: 12,
    marginVertical: 6,
    minHeight: 74,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryDark,
    shadowColor: '#7A5B93',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardOcupadoPrivado: {
    backgroundColor: '#F1F3F6',
    borderLeftColor: colors.muted,
  },
  cardOcupadoHora: { fontSize: 12, fontWeight: '900', color: colors.scheduleBlueText },
  statusPill: { fontSize: 10, color: colors.success, fontWeight: '900' },
  cardOcupadoTitulo: { fontSize: 13, fontWeight: '900', color: colors.scheduleBlueText, marginVertical: 2 },
  cardOcupadoObs: { fontSize: 10, color: '#526D83' },
  cardBloqueado: {
    backgroundColor: '#FFF7DF',
    padding: 11,
    borderRadius: 12,
    marginLeft: 60,
    marginRight: 12,
    marginVertical: 6,
    minHeight: 62,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  bloqueadoHora: { fontWeight: '900', color: colors.warning },
  bloqueadoTexto: { color: '#846800', fontWeight: '800' },
  bloqueadoHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  footerAcoes: {
    position: 'absolute',
    bottom: 70,
    right: 15,
    left: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnHoje: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 2,
  },
  btnHojeTexto: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  btnFlutuante: {
    backgroundColor: colors.primaryDark,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  tabBarInferior: {
    height: 68,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabItemAtivo: {
    backgroundColor: colors.primary,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    flex: 0,
  },
  tabTexto: { fontSize: 10, color: colors.muted, marginTop: 2 },
  tabTextoAtivo: { color: '#FFF', fontWeight: '900' },
  tituloSecao: {
    backgroundColor: colors.softLavender,
    color: colors.muted,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  linhaFormRow: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dataHoraEditor: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  dataControls: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  dataControlBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softLavender,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  dataControlText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'center',
  },
  horariosPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  horarioChip: {
    width: '22.8%',
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  horarioChipAtivo: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  horarioChipIndisponivel: {
    backgroundColor: '#F1F3F6',
    opacity: 0.58,
  },
  horarioChipTexto: { color: colors.text, fontWeight: '900', fontSize: 12 },
  horarioChipTextoAtivo: { color: '#FFF' },
  horarioChipTextoIndisponivel: { color: colors.muted },
  centerCell: { flex: 1, alignItems: 'center' },
  linhaFormItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clienteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  clienteActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  subLabel: { fontSize: 11, color: colors.muted },
  destaqueTexto: { fontSize: 14, fontWeight: '900', color: colors.text, marginTop: 2 },
  formLabel: { fontSize: 14, color: colors.text, fontWeight: '800' },
  linkText: { color: colors.primaryDark, fontWeight: '900', fontSize: 13 },
  editText: { color: colors.blueButton, fontWeight: '900', padding: 8 },
  deleteText: { color: colors.danger, fontWeight: '900', padding: 8 },
  inputWrap: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.surface },
  inputObservacao: {
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  inputForm: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  senhaWrap: {
    position: 'relative',
    marginBottom: 15,
  },
  senhaInput: {
    marginBottom: 0,
    paddingRight: 52,
  },
  senhaToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDdi: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    width: 58,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  btnSalvarPrincipal: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 15,
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  btnSalvarInterno: {
    marginTop: 8,
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  btnDesabilitado: {
    opacity: 0.65,
  },
  btnSalvarTexto: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  btnCliente: {
    marginTop: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  btnClienteTexto: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  btnCadastroPublico: {
    marginTop: 4,
    backgroundColor: colors.softLavender,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  btnCadastroPublicoTexto: { color: colors.primaryDark, fontWeight: '900', fontSize: 14 },
  btnAgendarRapido: {
    marginTop: 10,
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  btnAgendarRapidoTexto: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  btnVoltarLogin: { marginTop: 10, padding: 12, alignItems: 'center' },
  btnVoltarLoginTexto: { color: colors.muted, fontWeight: '900' },
  formInlineBox: {
    padding: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  formHint: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 10,
  },
  edicaoBanner: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.softLavender,
    borderWidth: 1,
    borderColor: colors.border,
  },
  edicaoBannerTexto: { color: colors.primaryDark, fontWeight: '900', textAlign: 'center' },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  durationBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  durationBtnAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationBtnTexto: { color: colors.text, fontWeight: '900' },
  durationBtnTextoAtivo: { color: '#FFF' },
  btnCancelar: {
    margin: 15,
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#FFC7C7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelarTexto: { color: colors.danger, fontWeight: '900' },
  btnEditarComanda: {
    marginHorizontal: 15,
    marginTop: 8,
    backgroundColor: colors.softLavender,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnEditarComandaTexto: { color: colors.primaryDark, fontWeight: '900' },
  searchArea: {
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softLavender,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  smallAddBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  smallAddText: { color: '#FFF', fontWeight: '900' },
  rowServico: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  miniIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softLavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  listTitle: { fontWeight: '900', color: colors.text },
  comandaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    margin: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comandaNumero: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 12,
    color: colors.text,
  },
  comandaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  metaComanda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: { color: colors.text, fontSize: 13, fontWeight: '900' },
  valorTxt: { color: colors.success, fontWeight: '900' },
  txtComandaValue: { fontSize: 13, color: colors.muted, maxWidth: '60%', textAlign: 'right' },
  whatsappBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  whatsappMiniBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  comandaSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, width: '82%', overflow: 'hidden' },
  modalHeaderHeader: { backgroundColor: colors.primary, padding: 12, alignItems: 'center' },
  modalHeaderText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  modalBotaoOpcao: { padding: 18, alignItems: 'center', width: '100%' },
  modalBotaoTexto: { fontSize: 15, color: colors.text, fontWeight: '900' },
  modalLine: { height: 1, backgroundColor: colors.border, width: '100%' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  menuCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    margin: '1%',
    alignItems: 'center',
  },
  menuText: { marginTop: 8, color: colors.text, fontWeight: '900', textAlign: 'center' },
  emptyBox: { padding: 20 },
  emptyText: { padding: 18, color: colors.muted, textAlign: 'center', fontWeight: '700' },
  configCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  configTitle: { fontWeight: '900', color: colors.text, fontSize: 15, marginBottom: 8 },
  configLine: { color: colors.muted, marginBottom: 5, lineHeight: 20 },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  badgeAniversario: {
    backgroundColor: colors.softLavender,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeAniversarioTexto: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  fotoCliente: { width: 88, height: 88, borderRadius: 44, alignSelf: 'center', marginBottom: 12, backgroundColor: colors.softLavender },
});

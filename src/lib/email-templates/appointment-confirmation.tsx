import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Zugher Horizon'

interface AppointmentConfirmationProps {
  contactName?: string
  dateLabel?: string
  timeLabel?: string
  format?: 'call' | 'video'
  meetingLink?: string | null
  contactPhone?: string | null
}

const AppointmentConfirmationEmail = ({
  contactName,
  dateLabel,
  timeLabel,
  format = 'video',
  meetingLink,
  contactPhone,
}: AppointmentConfirmationProps) => {
  const isVideo = format === 'video'
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>
        Votre rendez-vous {isVideo ? 'visio' : 'téléphonique'} est confirmé
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Rendez-vous confirmé</Heading>
          <Text style={text}>
            {contactName ? `Bonjour ${contactName},` : 'Bonjour,'}
          </Text>
          <Text style={text}>
            Votre rendez-vous {isVideo ? 'en visioconférence' : 'téléphonique'}{' '}
            avec l'équipe {SITE_NAME} est confirmé.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Date</Text>
            <Text style={cardValue}>{dateLabel ?? '—'}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Horaire</Text>
            <Text style={cardValue}>{timeLabel ?? '—'}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Format</Text>
            <Text style={cardValue}>
              {isVideo ? 'Visioconférence (Google Meet)' : 'Appel téléphonique'}
            </Text>
            {!isVideo && contactPhone ? (
              <>
                <Hr style={hr} />
                <Text style={cardLabel}>Numéro de rappel</Text>
                <Text style={cardValue}>{contactPhone}</Text>
              </>
            ) : null}
          </Section>

          {isVideo && meetingLink ? (
            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button style={button} href={meetingLink}>
                Rejoindre la visio
              </Button>
              <Text style={smallMuted}>
                Ou copiez ce lien :{' '}
                <Link href={meetingLink} style={linkStyle}>
                  {meetingLink}
                </Link>
              </Text>
            </Section>
          ) : null}

          <Text style={text}>
            Une invitation Google Calendar vous a également été envoyée. En cas
            d'imprévu, répondez simplement à cet email pour reprogrammer.
          </Text>
          <Text style={footer}>À très bientôt, l'équipe {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AppointmentConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Rendez-vous confirmé · ${data?.dateLabel ?? ''} ${data?.timeLabel ?? ''}`.trim(),
  displayName: 'Confirmation de rendez-vous',
  previewData: {
    contactName: 'Camille Dupont',
    dateLabel: 'lundi 9 juin 2026',
    timeLabel: '14:30 (heure de Paris)',
    format: 'video',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 24px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const card = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '20px 22px',
  margin: '20px 0',
}
const cardLabel = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#64748b',
  margin: '0 0 4px',
}
const cardValue = {
  fontSize: '16px',
  color: '#0f172a',
  fontWeight: 600,
  margin: '0 0 4px',
}
const hr = { borderColor: '#e2e8f0', margin: '14px 0' }
const button = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const linkStyle = { color: '#0f172a', wordBreak: 'break-all' as const }
const smallMuted = {
  fontSize: '12px',
  color: '#64748b',
  margin: '12px 0 0',
}
const footer = {
  fontSize: '13px',
  color: '#64748b',
  margin: '28px 0 0',
}

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InviteEmailProps {
  inviterName: string;
  role: "INSTRUCTOR" | "STUDENT";
  activationUrl: string;
  expiresInHours: number;
}

export function InviteEmail({
  inviterName,
  role,
  activationUrl,
  expiresInHours,
}: InviteEmailProps) {
  const roleLabel = role === "INSTRUCTOR" ? "an Instructor" : "a Student";

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} has invited you to join AKLAS Academy as {roleLabel}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>AKLAS</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>You&apos;re invited to AKLAS Academy</Heading>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join AKLAS Academy as{" "}
              <strong>{roleLabel}</strong>.
            </Text>
            <Text style={paragraph}>
              Click the button below to set up your account. This invitation expires in{" "}
              <strong>{expiresInHours} hours</strong>.
            </Text>

            <Section style={buttonSection}>
              <Button href={activationUrl} style={button}>
                Accept Invitation &amp; Set Password
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy and paste this URL into your browser:
            </Text>
            <Text style={linkText}>{activationUrl}</Text>

            <Hr style={hr} />

            <Text style={footer}>
              If you weren&apos;t expecting this invitation, you can safely ignore this email.
              This link will expire automatically after {expiresInHours} hours.
            </Text>
            <Text style={footer}>
              Need help? Contact your administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f7f7f8",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const header: React.CSSProperties = {
  backgroundColor: "#4a3fd4",
  borderRadius: "12px 12px 0 0",
  padding: "24px 32px",
};

const logoText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 12px 12px",
  padding: "32px",
  border: "1px solid #e8e7ee",
  borderTop: "none",
};

const h1: React.CSSProperties = {
  color: "#131018",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  color: "#4a4a5a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#4a3fd4",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const smallText: React.CSSProperties = {
  color: "#8a8a9a",
  fontSize: "12px",
  margin: "0 0 4px",
};

const linkText: React.CSSProperties = {
  color: "#4a3fd4",
  fontSize: "12px",
  wordBreak: "break-all",
  margin: "0 0 24px",
};

const hr: React.CSSProperties = {
  borderColor: "#e8e7ee",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#9a9aaa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

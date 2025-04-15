import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { FC } from 'react';

interface WelcomeEmailProps {
  name: string;
  actionLink?: string;
}

export const WelcomeEmail: FC<WelcomeEmailProps> = ({
  name,
  actionLink = 'https://example.com',
}) => (
  <Html>
    <Head />
    <Preview>Welcome to Your App!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logo}>
          <Heading as="h1">Your App</Heading>
        </Section>
        
        <Section style={content}>
          <Heading as="h2">Welcome, {name}!</Heading>
          <Text style={paragraph}>
            We're thrilled to have you on board. Your account has been successfully created.
          </Text>
          <Text style={paragraph}>
            Get started by exploring the app and setting up your profile.
          </Text>
          
          <Section style={buttonContainer}>
            <Link style={button} href={actionLink}>
              Get Started
            </Link>
          </Section>
          
          <Text style={paragraph}>
            If you have any questions, feel free to reply to this email.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Your App. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
  borderRadius: '5px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const logo = {
  padding: '0 32px',
  marginTop: '24px',
  marginBottom: '10px',
};

const content = {
  padding: '0 32px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#404040',
};

const buttonContainer = {
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#5850eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 16px',
  width: '220px',
  margin: '0 auto',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
  paddingTop: '32px',
  paddingLeft: '32px',
  paddingRight: '32px',
};

const footerText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#8898aa',
  margin: '0',
};

export default WelcomeEmail;

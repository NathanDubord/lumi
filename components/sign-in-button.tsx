import Link from 'next/link';

type SignInButtonProps = {
  className?: string;
};

export function SignInButton({ className }: SignInButtonProps) {
  return (
    <Link href="/login" className={className}>
      Sign in
    </Link>
  );
}

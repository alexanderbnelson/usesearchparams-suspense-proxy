import "./globals.css";

type LayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout(props: LayoutProps) {
  const { children } = props;
  return children;
}

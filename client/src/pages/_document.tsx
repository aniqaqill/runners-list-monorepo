import Document, { Html, Head, Main, NextScript } from 'next/document';

class Documents extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="running-white.svg" type="image/x-icon" />
          {/* <link rel="icon" href="running-black.svg" type="image/x-icon" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Documents;
import { ranker } from '@clinia/models-client-ranker';

async function runRankerExample() {
  const myRanker = ranker({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  const result = await myRanker.rank(
    'ranker_medical_journals_qa',
    '120240905185925',
    {
      query: 'hello, how are you?',
      texts: ['Clinia is based in Montreal'],
      id: 'request-123',
    },
  );

  console.log('Rank result:', result);
}

runRankerExample().catch(console.error);

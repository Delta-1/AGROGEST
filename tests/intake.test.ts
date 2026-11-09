import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY_INTAKE, intakeSummary, parseIntake, serializeIntake, validateIntake, validateIntakeContact} from '../src/lib/intake';
import {suggestions} from '../src/lib/files';
const answers = {...EMPTY_INTAKE, service:'documents',activity:'livestock',stage:'first',city:'Brasiléia',state:'AC',urgency:'deadline',deadline:'2026-12-10'};

test('intake retains the service, deadline and location from visitor to staff inbox', () => {
  const body = serializeIntake(answers);
  assert.ok(body.length < 2000);
  assert.deepEqual(parseIntake(body), answers);
  assert.match(intakeSummary(answers), /Organização de documentos/);
  assert.match(intakeSummary(answers), /10\/12\/2026/);
});
test('intake validates the current step without losing answers, and rejects unknown choices', () => {
  assert.equal(validateIntake({...EMPTY_INTAKE,service:'documents'},0),'');
  assert.match(validateIntake({...answers,state:'XX'}),/UF/);
  assert.match(validateIntake({...answers,service:'toString'}),/Selecione/);
  assert.match(validateIntake({...answers,deadline:'2026-02-31'}),/data/);
  assert.match(validateIntakeContact({name:'Visitante',phone:'abc99999999999',email:''}),/telefone/);
});
test('inbox accepts old messages as plain text and never trusts malformed questionnaire JSON', () => {
  assert.equal(parseIntake('Quero falar com a equipe.'),null);
  assert.equal(parseIntake('{"schema":"agrogest.intake.v1","service":null}'),null);
  assert.equal(parseIntake(serializeIntake({...answers,urgency:'planning'}))?.deadline,'');
});
test('OCR suggestions preserve source pages and normalize a labeled birth date for review', () => {
  const fields=suggestions('identity','[Página 2]\nIDENTIDADE\nNome completo: MARIA EXEMPLO\nCPF: 529.982.247-25\nNascimento: 21/08/1990\n');
  assert.equal(fields.find(f=>f.key==='name')?.value,'MARIA EXEMPLO');
  assert.equal(fields.find(f=>f.key==='cpf')?.page,2);
  assert.equal(fields.find(f=>f.key==='birthDate')?.value,'1990-08-21');
  assert.ok(fields.every(f=>f.confidence===null));
  assert.equal(suggestions('identity','Nascimento: 31/02/1990')[2].value,'');
});

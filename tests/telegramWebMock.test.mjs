import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSession, validateWebSubmission, gradeWebMsqSession } from '../lib/telegramWebMock.js';
const questions=[{id:'q',type:'MSQ',marks:2,topic:'x',question:'Q',options:{A:'a',B:'b',C:'c',D:'d'},answers:['A','C'],explanation:'why'}];
test('web helpers sanitize, validate rationales, and grade exact sets',()=>{
 const publicData=publicSession({web_token:'t',status:'in_progress',questions,responses:{},reasoning:{}});
 assert.equal(JSON.stringify(publicData).includes('answers'),false);
 assert.throws(()=>validateWebSubmission(questions,{0:['A']},{0:{A:'x',B:'',C:'x',D:'x'}}));
 const valid=validateWebSubmission(questions,{0:['C','A']},{0:{A:' yes ',B:' no ',C:' yes ',D:' no '}});
 assert.equal(valid.reasoning[0].A,'yes');
 assert.equal(gradeWebMsqSession(questions,valid.responses,valid.reasoning).score,2);
});

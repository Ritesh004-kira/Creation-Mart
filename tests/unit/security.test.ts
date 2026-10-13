import { it,expect } from 'vitest';
import { safeReturnTo } from '../../src/server/http/return-to';
import { fitScore } from '../../src/domain/fit-score';
it.each(['https://evil.test','//evil.test','/\\evil.test','/auth/callback','/api/v1/onboarding','/brand\n'])('rejects unsafe return path %s',v=>expect(safeReturnTo(v)).toBe('/dashboard'));
it('retains authorized discovery context',()=>expect(safeReturnTo('/creators?q=video&page=2')).toBe('/creators?q=video&page=2'));
it.each(['/creator/../api/v1/sign-out','/creators/%2f%2fevil.test','/brand/%5c..'])('rejects encoded or normalized escape %s',v=>expect(safeReturnTo(v)).toBe('/dashboard'));
it('normalizes over applicable dimensions but keeps requested failures',()=>expect(fitScore([{name:'outcomes',weight:35,value:0,applicable:true,numerator:0,denominator:1,evidenceIds:[]},{name:'styles',weight:20,value:1,applicable:false,numerator:0,denominator:0,evidenceIds:[]},{name:'evidence',weight:10,value:1,applicable:true,numerator:2,denominator:2,evidenceIds:[]}])).toBe(22.2));
it('rejects impossible score values',()=>expect(()=>fitScore([{name:'bad',weight:35,value:2,applicable:true,numerator:2,denominator:1,evidenceIds:[]}])).toThrow());

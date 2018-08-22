import {Parser} from "../src/background/parser";
const should = require('should');
describe('Parser', () => {
    it('interpolates user value', () => {
        const parser = new Parser({name: 'Gary'}, getDummyLogger());
        const res = parser.interpolate('My name is ${name}!');
        res.processedStr.should.equal('My name is Gary!');
        res.field.should.equal('name');
    });

    it('parses condition strings', () => {
        const parser = new Parser({sex: "Male"}, getDummyLogger());
        const res = parser.parseConditionStr("$userData.sex==male");
        res.should.be.True();
    });

    it('formats valid country', () => {
        const parser = new Parser({country: "United States of America"}, getDummyLogger());
        const res = parser.getValAndFormat("country|country-a2");
        res.should.equal('US');
    });

    it('formats substring', () => {
        const parser = new Parser({phone: "+86"}, getDummyLogger());
        const res = parser.getValAndFormat("phone|[1:]");
        res.should.equal('86')
    });
});

function getDummyLogger() {
    return {
        appendLogs: (logs) => {},
    };
}
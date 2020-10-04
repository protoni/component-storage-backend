/* eslint-disable no-undef */
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.should();
chai.use(chaiHttp);

describe('Test API', () => {
  describe('GET /api/test', () => {
    it('Should return success', (done) => {
      chai.request(server)
        .get('/api/test')
        .end((err, response) => {
          console.log('response:');
          console.log(response.body);
          response.should.have.status(200);
          response.body.message.should.equal('success');
          done();
        });
    });
  });
});

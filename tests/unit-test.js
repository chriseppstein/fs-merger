"use strict";
const expect = require("chai").expect;
const FSMerge = require('../index');
const fixturify = require('fixturify');
const rm = require('rimraf').sync;
const path = require('path');
const fs = require('fs');

describe('fs-reader', function () {
  before(function() {
    fixturify.writeSync('fixtures', {
      'test-1': {
        'a.txt': 'hello',
        'test-1': {
          'b.txt': 'b contains text'
        },
        'x.txt': 'one more file'
      },
      'test-2': {
        'a.txt': 'this is same other',
        'c.txt': 'this is new file',
        'test-sub-1': {
          'sub-b.txt': 'this is inside test-sub-1',
          'test-sub-sub-1': {
            'sub-sub-b.txt': 'this is inside of test-sub-sub-1'
          }
        },
        'test-sub-2': {

        }
      },
      'test-3': {
        'd.txt': 'this is different file',
        'b.txt': 'This is file which is same as test-1/test-1/b.txt',
        'test-sub-1': {
          'sub-c.txt': 'this is inside test-sub-1',
          'test-sub-sub-1': {
            'sub-sub-c.txt': 'this is inside of test-sub-sub-1'
          }
        }
      }
    });
  });
  after(function () {
    rm('fixtures');
  });

  describe('Reads file from given location', function() {
    let fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']);
    it('a.txt', function () {
      let content = fsMerger.fs.readFileSync('a.txt', 'utf-8');
      expect(content).to.be.equal('this is same other');
    });
    it('c.txt', function () {
      let content = fsMerger.fs.readFileSync('c.txt', 'utf-8');
      expect(content).to.be.equal('this is new file');
    });
    it('test-1/b.txt', function () {
      let content = fsMerger.fs.readFileSync('c.txt', 'utf-8');
      expect(content).to.be.equal('this is new file');
    });
    it('test-1/b.txt', function () {
      let content = fsMerger.fs.readFileSync('test-1/b.txt', 'utf-8');
      expect(content).to.be.equal('b contains text');
    });
    it('test-1/b.txt', function () {
      let content = fsMerger.fs.readFileSync('test-sub-1/test-sub-sub-1/sub-sub-c.txt', 'utf-8');
      expect(content).to.be.equal('this is inside of test-sub-sub-1');
    });
  });
  describe('Reads file meta details', function() {
    let fs = new FSMerge(['fixtures/test-1', {
      root: 'fixtures/test-2',
      prefix: 'test-2',
      getDestinationPath: undefined
    }, {
      outputPath: 'fixtures/test-3'
    }]);
    it('correct meta for string', function () {
      let meta = fs.readFileMeta('x.txt');
      expect(meta).to.eql({
        path: path.normalize('fixtures/test-1/x.txt'),
        prefix: '',
        getDestinationPath: undefined,
      });
    });
    it('correct meta for provided prefix', function () {
      let meta = fs.readFileMeta('c.txt');
      expect(meta).to.eql({
        path: path.normalize('fixtures/test-2/c.txt'),
        prefix: 'test-2',
        getDestinationPath: undefined,
      });
    });
    it('correct meta for broccoli node', function () {
      let meta = fs.readFileMeta('d.txt')
      expect(meta).to.eql({
        path: path.normalize('fixtures/test-3/d.txt'),
        prefix: '',
        getDestinationPath: undefined,
      })
    });
    it('correct meta when basePath is provided', function () {
      let meta = fs.readFileMeta('d.txt', { basePath: 'fixtures/test-3'})
      expect(meta).to.eql({
        path: path.normalize('fixtures/test-3/d.txt'),
        prefix: '',
        getDestinationPath: undefined,
      })
    });
  });

  describe('Reads contents of the folder from location', function() {
    let fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']);

    describe('read test-1 folder', function() {
      it('readdirSync', function() {
        let content = fsMerger.fs.readdirSync('test-1');
        expect(content).to.be.deep.equal(['b.txt']);
      });
      it('readdir', function(done) {
        fsMerger.fs.readdir('test-1', function (err, content) {
          expect(content).to.have.all.members(['b.txt']);
          done();
        });
      });
    });

    describe('read test-sub-1 sub-folder', function() {
      it('readdirSync', function() {
        let content = fsMerger.fs.readdirSync('test-sub-1');
        expect(content).to.be.deep.equal([ 'sub-b.txt', 'test-sub-sub-1', 'sub-c.txt' ]);
      });
      it('readdir', function(done) {
        fsMerger.fs.readdir('test-sub-1', function (err, content) {
          expect(content).to.have.all.members([ 'sub-b.txt', 'test-sub-sub-1', 'sub-c.txt' ]);
          done();
        });
      });
    });

    describe('read test-sub-1/test-sub-sub-1 folder', function() {
      it('readdirSync', function() {
        let content = fsMerger.fs.readdirSync('test-sub-1/test-sub-sub-1');
        expect(content).to.be.deep.equal([ 'sub-sub-b.txt', 'sub-sub-c.txt' ]);
      });
      it('readdir', function(done) {
        fsMerger.fs.readdir('test-sub-1/test-sub-sub-1', function (err, content) {
          expect(content).to.have.all.members([ 'sub-sub-b.txt', 'sub-sub-c.txt' ]);
          done();
        });
      });

    });

    describe('read ./ folder', function() {
      it('readdirsync', function() {
        let content = fsMerger.fs.readdirSync('./');
        expect(content).to.be.deep.equal([ 'a.txt', 'test-1', 'x.txt','c.txt', 'test-sub-1', 'test-sub-2', 'b.txt', 'd.txt']);
      });
      it('readdir', function(done) {
        fsMerger.fs.readdir('./', function (err, content) {
          expect(content).to.have.all.members([ 'a.txt', 'test-1', 'x.txt','c.txt', 'test-sub-1', 'test-sub-2', 'b.txt', 'd.txt']);
          done();
        });
      });
    });

    describe('reading folder invalid folder will throw', function() {
      it('readdirsync', function() {
        expect(() => {
          fsMerger.fs.readdirSync('sfsd')
        }).throw(/ENOENT\: no such file or directory, scandir.*/);
      });

      it('readdir', function(done) {
        fsMerger.fs.readdir('sfsd', function (err) {
          expect(err.message).to.be.contains(`ENOENT: no such file or directory, scandir `);
          done();
        });
      });
    });

    describe(`shouldn't throw error when folder exist but empty`, function() {
      it('readdirSync', function() {
        let content = fsMerger.fs.readdirSync('test-sub-2');
        expect(content).to.be.deep.equal([]);
      });
      it('readdir', function(done) {
        fsMerger.fs.readdir('test-sub-2', function (err, content) {
          expect(content).to.have.all.members([]);
          done();
        });
      });
    });

    describe(`error from fs.readdir matches error from fsMerger.fs.readdir`, function() {
      it('readdir', function(done) {
        let fsError = '';
        fs.readdir('fixtures/test-1/test-1', (err, list) => {
          try {
            fs.readFileSync(list[0]);
          }catch (error) {
            fsError = error;
          }
        });
        fsMerger.fs.readdir('test-1', (err, list) => {
          try {
            fs.readFileSync(list[0]);
          } catch (error) {
            expect(error.syscall).to.be.equal(fsError.syscall);
            expect(error.errno).to.be.equal(fsError.errno);
            expect(error.message).to.be.equal(fsError.message);
            expect(error.code).to.be.equal(fsError.code);
            expect(error.path).to.be.equal(fsError.path);
            done();
          }
        });
      });
    });
  });

  describe('Verify few fs operations', function() {
    let fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']);

    it('existsSync works', function() {
      let content = fsMerger.fs.existsSync('test-1');
      expect(content).to.be.true;
    });

    it('absolute path throws error', function() {
      let filepath = `${__dirname}/../fixtures/test-1`;
      expect( ()=>{fsMerger.fs.existsSync(filepath)}).to.throw(`Relative path is expected, path ${filepath} is an absolute path. inputPath gets prefixed to the reltivePath provided.`);
    });

    it('writeFileSync operation must throw error', function () {
      let fsMerger = new FSMerge(['fixtures/test-1']);
      expect(()=>{
        fsMerger.fs.writeFileSync('read.md', 'test');
      }).to.throw(`Operation writeFileSync is not allowed with FSMerger.fs. Allowed operations are readFileSync,existsSync,lstatSync,statSync,readdirSync,readDir,readFileMeta,entries`);
    });
  });

  describe('Returns entries for', function() {
    let fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']);
    it('root path', function () {
      let fsEntries = fsMerger.entries();
      let fileList = [];
      let walkList = ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'test-1/', 'test-1/b.txt', 'test-sub-1/', 'test-sub-1/sub-b.txt', 'test-sub-1/sub-c.txt', 'test-sub-1/test-sub-sub-1/', 'test-sub-1/test-sub-sub-1/sub-sub-b.txt', 'test-sub-1/test-sub-sub-1/sub-sub-c.txt', 'test-sub-2/' ,'x.txt'];
      fsEntries.forEach(entry => {
        fileList.push(entry.relativePath);
      });
      expect(fileList).to.be.deep.equal(walkList);
    });
    it('test-1', function () {
      let fsEntries = fsMerger.entries('test-1');
      let fileList = [];
      let walkList = [ 'b.txt' ];
      fsEntries.forEach(entry => {
        fileList.push(entry.relativePath);
      });

      expect(fileList).to.be.deep.equal(walkList);
    });
    it('test-sub-1', function() {
      let fsEntries = fsMerger.entries('test-sub-1');
      let fileList = [];
      let walkList = [ 'sub-b.txt', 'sub-c.txt', 'test-sub-sub-1/', 'test-sub-sub-1/sub-sub-b.txt', 'test-sub-sub-1/sub-sub-c.txt' ];
      fsEntries.forEach(entry => {
        fileList.push(entry.relativePath);
      });

      expect(fileList).to.be.deep.equal(walkList);
    });
    it('test-sub-1/test-sub-sub-1', function() {
      let fsEntries = fsMerger.entries('test-sub-1/test-sub-sub-1');
      let fileList = [];
      let walkList = [ 'sub-sub-b.txt', 'sub-sub-c.txt' ];
      fsEntries.forEach(entry => {
        fileList.push(entry.relativePath);
      });
      expect(fileList).to.be.deep.equal(walkList);
    });

    it('can read entries from fsMeger.fs as well', function () {
      fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']).fs;
      let fsEntries = fsMerger.entries('./');
      let fileList = [];
      let walkList = ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'test-1/', 'test-1/b.txt', 'test-sub-1/', 'test-sub-1/sub-b.txt', 'test-sub-1/sub-c.txt', 'test-sub-1/test-sub-sub-1/', 'test-sub-1/test-sub-sub-1/sub-sub-b.txt', 'test-sub-1/test-sub-sub-1/sub-sub-c.txt', 'test-sub-2/' ,'x.txt'];
      fsEntries.forEach(entry => {
        fileList.push(entry.relativePath);
      });
      expect(fileList).to.be.deep.equal(walkList);
    });
  });

  describe('at operation', function () {
    let fsMerger = new FSMerge(['fixtures/test-1', 'fixtures/test-2', 'fixtures/test-3']);
    it('at works', function() {
      let content = fsMerger.at(0);
      expect(content instanceof FSMerge).to.be.true;
    });
    it('can access file contents', function() {
      let indexMerger = fsMerger.at(0);
      let content = indexMerger.readFileSync('a.txt', 'utf-8');
      expect(content).to.be.equal('hello');
    });
  });
});
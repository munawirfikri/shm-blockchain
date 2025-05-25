'use strict';

const { Contract } = require('fabric-contract-api');

class SHMContract extends Contract {

  async initLedger(ctx) {
    console.info('Ledger initialized');
  }

  async createSHM(ctx, shmId, pemilik, alamat, luas, tanggalTerbit) {
    const shm = {
      shmId,
      pemilik,
      alamat,
      luas,
      tanggalTerbit,
      docType: 'shm'
    };

    await ctx.stub.putState(shmId, Buffer.from(JSON.stringify(shm)));
    return shm;
  }

  async readSHM(ctx, shmId) {
    const data = await ctx.stub.getState(shmId);
    if (!data || data.length === 0) {
      throw new Error(`Sertifikat dengan ID ${shmId} tidak ditemukan`);
    }
    return JSON.parse(data.toString());
  }

  async updateSHM(ctx, shmId, pemilik, alamat, luas, tanggalTerbit) {
    const exists = await ctx.stub.getState(shmId);
    if (!exists || exists.length === 0) {
      throw new Error(`Sertifikat ${shmId} tidak ditemukan`);
    }

    const updatedSHM = {
      shmId,
      pemilik,
      alamat,
      luas,
      tanggalTerbit,
      docType: 'shm'
    };

    await ctx.stub.putState(shmId, Buffer.from(JSON.stringify(updatedSHM)));
    return updatedSHM;
  }

  async deleteSHM(ctx, shmId) {
    const exists = await ctx.stub.getState(shmId);
    if (!exists || exists.length === 0) {
      throw new Error(`Sertifikat ${shmId} tidak ditemukan`);
    }

    await ctx.stub.deleteState(shmId);
    return `Sertifikat ${shmId} berhasil dihapus`;
  }

async getAllSHM(ctx) {
  const results = [];
  const iterator = await ctx.stub.getStateByRange('', '');

  while (true) {
    const res = await iterator.next();

    if (res.value && res.value.value.toString()) {
      const jsonRes = JSON.parse(res.value.value.toString('utf8'));
      results.push(jsonRes);
    }

    if (res.done) {
      await iterator.close();
      break;
    }
  }

  return JSON.stringify(results);
}

}

module.exports = SHMContract;

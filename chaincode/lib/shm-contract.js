/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class SHMContract extends Contract {

  /**
   * Inisialisasi ledger dengan beberapa data contoh
   */
  async initLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    const shmData = [
      {
        nomor_sertifikat: '16.03.01.02.1.00001',
        penerbit: 'Kantor Pertanahan Pekanbaru',
        pemilik: { nama: 'Fikri', nik: '147101010101' },
        properti: {
          nomor_objek_pajak: '31.74.010.001.001-0123.0',
          luas_tanah: 300,
          lokasi: { alamat: 'Jl. Cenderawasih No. 10', desa_kelurahan: 'Tangkerang Baray', kecamatan: 'Marpoyan Damai', kota_kabupaten: 'Pekanbaru', provinsi: 'Riau' },
          referensi_surat_ukur: 'SU/2025/KL/005',
        },
      },
      {
        nomor_sertifikat: '10.15.22.05.3.01234',
        penerbit: 'Kantor Pertanahan Jakarta Selatan',
        pemilik: { nama: 'Arief', nik: '3174020202850002' },
        properti: {
          nomor_objek_pajak: '31.74.020.002.002-0456.0',
          luas_tanah: 500,
          lokasi: { alamat: 'Jl. Elang No. 25', desa_kelurahan: 'Cilandak', kecamatan: 'Cilandak', kota_kabupaten: 'Kota Jakarta Selatan', provinsi: 'DKI Jakarta' },
          referensi_surat_ukur: 'SU/2024/CDK/011',
        },
      },
    ];

    for (const data of shmData) {
        const shm = {
            ...data,
            status_sertifikat: 'AKTIF',
            tanggal_penerbitan: new Date().toISOString(),
            riwayat_transaksi: [{
                id_transaksi: ctx.stub.getTxID(),
                tanggal: new Date().toISOString(),
                jenis: 'Penerbitan Awal',
                keterangan: `Diterbitkan oleh ${data.penerbit} untuk ${data.pemilik.nama}`,
            }],
            doc_type: 'shm'
        };
        await ctx.stub.putState(shm.nomor_sertifikat, Buffer.from(JSON.stringify(shm)));
        console.info(`Sertifikat ${shm.nomor_sertifikat} berhasil ditambahkan`);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  /**
   * Membuat Sertifikat Hak Milik baru.
   */
  async createSHM(ctx, shmDataString) {
    const shmInput = JSON.parse(shmDataString);
    const { nomor_sertifikat, penerbit, pemilik, properti } = shmInput;

    if (!nomor_sertifikat || !penerbit || !pemilik || !properti) {
        throw new Error('Data SHM tidak lengkap. Pastikan nomor_sertifikat, penerbit, pemilik, dan properti ada.');
    }

    const exists = await this.readSHM(ctx, nomor_sertifikat).catch(() => null);
    if (exists) {
        throw new Error(`Sertifikat dengan nomor ${nomor_sertifikat} sudah ada`);
    }
    
    const shm = {
      nomor_sertifikat,
      status_sertifikat: 'AKTIF',
      penerbit,
      tanggal_penerbitan: new Date().toISOString(),
      pemilik,
      properti,
      riwayat_transaksi: [{
        id_transaksi: ctx.stub.getTxID(),
        tanggal: new Date().toISOString(),
        jenis: 'Penerbitan Awal',
        keterangan: `Diterbitkan oleh ${penerbit} untuk ${pemilik.nama}`,
      }],
      doc_type: 'shm',
    };

    await ctx.stub.putState(nomor_sertifikat, Buffer.from(JSON.stringify(shm)));
    return JSON.stringify(shm);
  }

  /**
   * Membaca data SHM berdasarkan Nomor Sertifikat.
   */
  async readSHM(ctx, nomorSertifikat) {
    const data = await ctx.stub.getState(nomorSertifikat);
    if (!data || data.length === 0) {
      throw new Error(`Sertifikat dengan nomor ${nomorSertifikat} tidak ditemukan`);
    }
    return JSON.parse(data.toString());
  }

  /**
   * Melakukan proses Balik Nama pada SHM.
   */
  async balikNama(ctx, nomorSertifikat, namaPemilikBaru, nikPemilikBaru) {
    const shm = await this.readSHM(ctx, nomorSertifikat);

    if (shm.status_sertifikat !== 'AKTIF') {
        throw new Error(`Tidak dapat melakukan balik nama. Status sertifikat saat ini: ${shm.status_sertifikat}`);
    }

    const pemilikLama = shm.pemilik.nama;
    shm.pemilik = { nama: namaPemilikBaru, nik: nikPemilikBaru };
    
    shm.riwayat_transaksi.push({
        id_transaksi: ctx.stub.getTxID(),
        tanggal: new Date().toISOString(),
        jenis: 'Balik Nama',
        keterangan: `Kepemilikan beralih dari ${pemilikLama} ke ${namaPemilikBaru}`,
    });

    await ctx.stub.putState(nomorSertifikat, Buffer.from(JSON.stringify(shm)));
    return JSON.stringify(shm);
  }

  /**
   * Membatalkan SHM dengan mengubah statusnya (bukan menghapus).
   */
  async batalkanSHM(ctx, nomorSertifikat, alasan) {
      const shm = await this.readSHM(ctx, nomorSertifikat);
      const statusLama = shm.status_sertifikat;
      shm.status_sertifikat = 'TIDAK_BERLAKU';

      shm.riwayat_transaksi.push({
          id_transaksi: ctx.stub.getTxID(),
          tanggal: new Date().toISOString(),
          jenis: 'Pembatalan Sertifikat',
          keterangan: `Sertifikat dibatalkan dari status ${statusLama}. Alasan: ${alasan}`,
      });

      await ctx.stub.putState(nomorSertifikat, Buffer.from(JSON.stringify(shm)));
      return `Sertifikat ${nomorSertifikat} berhasil dibatalkan.`;
  }

  /**
   * Mengambil semua data SHM yang ada di ledger.
   */
  async getAllSHM(ctx) {
      const allResults = [];
      const iterator = await ctx.stub.getStateByRange('', '');
      let result = await iterator.next();
      while (!result.done) {
          const strValue = Buffer.from(result.value.value).toString('utf8');
          let record;
          try {
              record = JSON.parse(strValue);
          } catch (err) {
              console.log(err);
              record = strValue;
          }
          allResults.push(record);
          result = await iterator.next();
      }
      return JSON.stringify(allResults);
  }
}

module.exports = SHMContract;
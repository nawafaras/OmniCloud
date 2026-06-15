import { once } from 'events';

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
	let value = index;
	for (let bit = 0; bit < 8; bit += 1) {
		value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
	}
	return value >>> 0;
});

function updateCrc(crc, chunk) {
	let next = crc;
	for (const byte of chunk) {
		next = CRC_TABLE[(next ^ byte) & 0xff] ^ (next >>> 8);
	}
	return next >>> 0;
}

function toDosDateTime(value = new Date()) {
	const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
	const year = Math.max(1980, date.getFullYear());
	const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
	const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
	return { dosDate, dosTime };
}

function localHeader(name, modifiedAt) {
	const nameBuffer = Buffer.from(name);
	const { dosDate, dosTime } = toDosDateTime(modifiedAt);
	const header = Buffer.alloc(30);
	header.writeUInt32LE(0x04034b50, 0);
	header.writeUInt16LE(20, 4);
	header.writeUInt16LE(0x0808, 6);
	header.writeUInt16LE(0, 8);
	header.writeUInt16LE(dosTime, 10);
	header.writeUInt16LE(dosDate, 12);
	header.writeUInt16LE(nameBuffer.length, 26);
	return { header: Buffer.concat([header, nameBuffer]), dosDate, dosTime, nameBuffer };
}

function dataDescriptor(crc, size) {
	const descriptor = Buffer.alloc(16);
	descriptor.writeUInt32LE(0x08074b50, 0);
	descriptor.writeUInt32LE(crc, 4);
	descriptor.writeUInt32LE(size, 8);
	descriptor.writeUInt32LE(size, 12);
	return descriptor;
}

function centralHeader(entry) {
	const header = Buffer.alloc(46);
	header.writeUInt32LE(0x02014b50, 0);
	header.writeUInt16LE(20, 4);
	header.writeUInt16LE(20, 6);
	header.writeUInt16LE(0x0808, 8);
	header.writeUInt16LE(0, 10);
	header.writeUInt16LE(entry.dosTime, 12);
	header.writeUInt16LE(entry.dosDate, 14);
	header.writeUInt32LE(entry.crc, 16);
	header.writeUInt32LE(entry.size, 20);
	header.writeUInt32LE(entry.size, 24);
	header.writeUInt16LE(entry.nameBuffer.length, 28);
	header.writeUInt32LE(entry.name.endsWith('/') ? 0x10 : 0, 38);
	header.writeUInt32LE(entry.offset, 42);
	return Buffer.concat([header, entry.nameBuffer]);
}

async function write(output, chunk) {
	if (!output.write(chunk)) {
		await once(output, 'drain');
	}
}

export async function streamZip(output, entries) {
	if (entries.length > 0xffff) {
		throw new Error('ZIP downloads currently support up to 65,535 items');
	}

	const centralEntries = [];
	let offset = 0;

	for (const entry of entries) {
		const { header, dosDate, dosTime, nameBuffer } = localHeader(entry.name, entry.modifiedAt);
		const entryOffset = offset;
		await write(output, header);
		offset += header.length;

		let crc = 0xffffffff;
		let size = 0;
		if (entry.openStream) {
			const stream = await entry.openStream();
			for await (const rawChunk of stream) {
				const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
				size += chunk.length;
				if (size > 0xffffffff) {
					throw new Error('ZIP downloads currently support files up to 4 GB');
				}
				crc = updateCrc(crc, chunk);
				await write(output, chunk);
				offset += chunk.length;
			}
		}

		crc = (crc ^ 0xffffffff) >>> 0;
		const descriptor = dataDescriptor(crc, size);
		await write(output, descriptor);
		offset += descriptor.length;
		centralEntries.push({
			name: entry.name,
			nameBuffer,
			dosDate,
			dosTime,
			crc,
			size,
			offset: entryOffset,
		});
		if (offset > 0xffffffff) {
			throw new Error('ZIP downloads currently support archives up to 4 GB');
		}
	}

	const centralOffset = offset;
	for (const entry of centralEntries) {
		const header = centralHeader(entry);
		await write(output, header);
		offset += header.length;
	}

	const centralSize = offset - centralOffset;
	if (offset > 0xffffffff || centralSize > 0xffffffff) {
		throw new Error('ZIP downloads currently support archives up to 4 GB');
	}
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(centralEntries.length, 8);
	end.writeUInt16LE(centralEntries.length, 10);
	end.writeUInt32LE(centralSize, 12);
	end.writeUInt32LE(centralOffset, 16);
	await write(output, end);
	output.end();
}

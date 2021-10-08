package com.lentokonepeli.network.binary;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.Map;

import com.lentokonepeli.Entity;
import com.lentokonepeli.network.NetProp;

public class BinaryPacker {

    ByteArrayOutputStream boas = new ByteArrayOutputStream();
    DataOutputStream dos = new DataOutputStream(boas);

    public void packState(Map<Integer, Entity> entities, boolean onlyChanges) {
        try {
            for (var ent : entities.values()) {

                var props = ent.getProps();

                if (props.size() == 0) {
                    continue;
                }

                boolean wroteData = false;
                var propBytes = new ByteArrayOutputStream();
                var propStream = new DataOutputStream(propBytes);

                int headerBytes = (int) Math.ceil((float) props.size() / 8);
                var header = new byte[headerBytes];

                int propIndex = 0;

                for (var prop : props) {
                    // do we actually care about this?
                    if (prop.isSet()) {
                        if ((onlyChanges && prop.isDirty()) || (onlyChanges == false)) {
                            int headerByte = propIndex / 8;
                            int headerBit = propIndex % 8;
                            // record this prop
                            header[headerByte] |= (1 << headerBit);
                            writePropToStream(propStream, prop);
                            wroteData = true;

                            if (onlyChanges) {
                                prop.setClean();
                            }
                        }
                    }
                    propIndex++;
                }
                if (wroteData) {
                    dos.writeShort(ent.getId());
                    dos.writeByte(ent.getType().ordinal());
                    dos.write(header);
                    dos.write(propBytes.toByteArray());
                }
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void writePropToStream(DataOutputStream out, NetProp<?> prop) throws IOException {
        switch (prop.type) {
            case BOOL:
                out.writeBoolean((Boolean) prop.get());
                break;
            case STRING:
                out.writeUTF((String) prop.get());
                break;
            case i16:
            case u16:
                out.writeShort((Integer) prop.get());
                break;
            case i32:
                out.writeInt((int) prop.get());
                break;
            case u32:
                out.writeInt((int) prop.get());
                break;
            case i8:
            case u8:
                out.writeByte((Integer) prop.get());
                break;
            default:
                break;
        }
    }

    public byte[] getBinary() {
        return boas.toByteArray();
    }

}

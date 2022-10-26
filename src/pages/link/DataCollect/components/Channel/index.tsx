import { observer } from '@formily/react';
import SearchComponent from '@/components/SearchComponent';
import { ProColumns } from '@jetlinks/pro-table';
import { useEffect, useState } from 'react';
import { useDomFullHeight } from '@/hooks';
import service from '@/pages/link/DataCollect/service';
import ChannelCard from '@/components/ProTableCard/CardItems/DataCollect/channel';
import { Empty, PermissionButton } from '@/components';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { onlyMessage } from '@/utils/util';
import { useIntl } from '@@/plugin-locale/localeExports';
import { Card, Col, Pagination, Row } from 'antd';
import { model } from '@formily/reactive';
import Save from '@/pages/link/DataCollect/components/Channel/Save';

interface Props {
  type: boolean; // true: 综合查询  false: 数据采集
}

const ChannelModel = model<{
  visible: boolean;
  current: Partial<ChannelItem>;
}>({
  visible: false,
  current: {},
});

export default observer((props: Props) => {
  const intl = useIntl();
  const { minHeight } = useDomFullHeight(`.data-collect-channel`, 24);
  const [param, setParam] = useState({});
  const { permission } = PermissionButton.usePermission('device/Instance');
  const [loading, setLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<any>({
    data: [],
    pageSize: 10,
    pageIndex: 0,
    total: 0,
  });

  const columns: ProColumns<ChannelItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '通讯协议',
      dataIndex: 'provider',
      valueType: 'select',
      valueEnum: {
        OPC_UA: {
          text: 'OPC_UA',
          status: 'OPC_UA',
        },
        MODBUS_TCP: {
          text: 'MODBUS_TCP',
          status: 'MODBUS_TCP',
        },
      },
    },
    {
      title: '状态',
      dataIndex: 'state',
      valueType: 'select',
      valueEnum: {
        enabled: {
          text: '正常',
          status: 'enabled',
        },
        disabled: {
          text: '禁用',
          status: 'disabled',
        },
      },
    },
  ];

  const handleSearch = (params: any) => {
    setLoading(true);
    setParam(params);
    service
      .queryChannel({ ...params, sorts: [{ name: 'createTime', order: 'desc' }] })
      .then((resp) => {
        if (resp.status === 200) {
          setDataSource(resp.result);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    handleSearch(param);
  }, []);

  return (
    <div>
      <SearchComponent<ChannelItem>
        field={columns}
        target="data-collect-channel"
        onSearch={(data) => {
          const dt = {
            pageSize: 10,
            terms: [...data?.terms],
          };
          handleSearch(dt);
        }}
      />
      <Card loading={loading} bordered={false}>
        <div style={{ position: 'relative', minHeight }}>
          <div style={{ height: '100%', paddingBottom: 48 }}>
            {dataSource?.data.length ? (
              <>
                <Row gutter={[24, 24]} style={{ marginTop: 10 }}>
                  {(dataSource?.data || []).map((record: any) => (
                    <Col key={record.id} span={props.type ? 8 : 12}>
                      <ChannelCard
                        {...record}
                        actions={[
                          <PermissionButton
                            type={'link'}
                            onClick={() => {
                              ChannelModel.current = record;
                              ChannelModel.visible = true;
                            }}
                            key={'edit'}
                            isPermission={permission.update}
                          >
                            <EditOutlined />
                            {intl.formatMessage({
                              id: 'pages.data.option.edit',
                              defaultMessage: '编辑',
                            })}
                          </PermissionButton>,
                          <PermissionButton
                            key="delete"
                            isPermission={permission.delete}
                            type={'link'}
                            style={{ padding: 0 }}
                            popConfirm={{
                              title: intl.formatMessage({
                                id: 'pages.data.option.remove.tips',
                              }),
                              disabled: record?.state?.value !== 'disabled',
                              onConfirm: async () => {
                                await service.removeChannel(record.id);
                                onlyMessage(
                                  intl.formatMessage({
                                    id: 'pages.data.option.success',
                                    defaultMessage: '操作成功!',
                                  }),
                                );
                              },
                            }}
                          >
                            <DeleteOutlined />
                          </PermissionButton>,
                        ]}
                      />
                    </Col>
                  ))}
                </Row>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    position: 'absolute',
                    width: '100%',
                    bottom: 0,
                  }}
                >
                  <Pagination
                    showSizeChanger
                    size="small"
                    className={'pro-table-card-pagination'}
                    total={dataSource?.total || 0}
                    current={dataSource?.pageIndex + 1}
                    onChange={(page, size) => {
                      handleSearch({
                        ...param,
                        pageIndex: page - 1,
                        pageSize: size,
                      });
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                    pageSize={dataSource?.pageSize}
                    showTotal={(num) => {
                      const minSize = dataSource?.pageIndex * dataSource?.pageSize + 1;
                      const MaxSize = (dataSource?.pageIndex + 1) * dataSource?.pageSize;
                      return `第 ${minSize} - ${MaxSize > num ? num : MaxSize} 条/总共 ${num} 条`;
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ height: minHeight - 150 }}>
                <Empty />
              </div>
            )}
          </div>
        </div>
      </Card>
      {ChannelModel.visible && (
        <Save
          data={ChannelModel.current}
          close={() => {
            ChannelModel.visible = false;
          }}
          reload={() => {
            ChannelModel.visible = false;
            handleSearch(param);
          }}
        />
      )}
    </div>
  );
});